import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreateBookingWithPassengersDto } from './dto/create-booking-with-passengers.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { AirlineStatisticService } from '../airline-statistic/airline-statistic.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly airlineStatisticService: AirlineStatisticService,
  ) {}

  /**
   * Generate mã PNR ngẫu nhiên (6 ký tự chữ và số)
   */
  private generatePNR(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pnr;
  }

  /**
   * Tự động gán số ghế cho hành khách theo thứ tự đặt vé
   */
  private async generateSeatNumbers(flightInstanceId: string, passengers: any[]): Promise<string[]> {
    // 1. Lấy thông tin aircraft để biết số ghế
    const { data: flightInstance } = await this.supabaseService.client
      .from('flight_instances')
      .select(`
        aircraft:aircraft_id (
          seat_capacity
        )
      `)
      .eq('id', flightInstanceId)
      .single();

    if (!flightInstance?.aircraft) {
      throw new BadRequestException('Không tìm thấy thông tin máy bay');
    }

    const seatCapacity = (flightInstance.aircraft as any).seat_capacity;
    const rows = Math.ceil(seatCapacity / 6); // Giả sử 6 ghế/1 hàng (A-F)
    const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    // 2. Lấy danh sách ghế đã được đặt cho chuyến bay này
    const { data: bookedSeats } = await this.supabaseService.client
      .from('passengers')
      .select(`
        seat_number,
        booking_segment:booking_segment_id (
          flight_instance_id
        )
      `)
      .not('seat_number', 'is', null);

    // Lọc chỉ những ghế của chuyến bay hiện tại
    const occupiedSeats = new Set(
      bookedSeats
        ?.filter(p => (p.booking_segment as any)?.flight_instance_id === flightInstanceId)
        ?.map(p => p.seat_number) || []
    );

    // 3. Tạo danh sách ghế trống
    const availableSeats: string[] = [];
    for (let row = 1; row <= rows; row++) {
      for (const letter of seatLetters) {
        const seatNumber = `${row}${letter}`;
        if (!occupiedSeats.has(seatNumber)) {
          availableSeats.push(seatNumber);
        }
      }
    }

    // 4. Kiểm tra đủ ghế không
    if (availableSeats.length < passengers.length) {
      throw new BadRequestException(`Không đủ ghế trống. Còn ${availableSeats.length} ghế nhưng cần ${passengers.length} ghế`);
    }

    // 5. Gán ghế theo thứ tự (từ ghế đầu tiên có sẵn)
    return passengers.map((_, index) => availableSeats[index]);
  }
  async create(createBookingDto: CreateBookingDto) {
    const {data, error } = await this.supabaseService.client
      .from('bookings')
      .insert(createBookingDto)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const {data, error } = await this.supabaseService.client
      .from('bookings')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const {data, error } = await this.supabaseService.client
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    const {data, error } = await this.supabaseService.client
      .from('bookings')
      .update(updateBookingDto)
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
  }

  async remove(id: string) {
    const {data, error } = await this.supabaseService.client
      .from('bookings')
      .delete()
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Tạo booking với thông tin hành khách đầy đủ
   */
  async createBookingWithPassengers(dto: CreateBookingWithPassengersDto) {
    const { user_id, contact_fullname, contact_phone, segments } = dto;

    // 1. Generate PNR code unique
    let pnrCode = this.generatePNR();
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const { data: existing } = await this.supabaseService.client
        .from('bookings')
        .select('pnr_code')
        .eq('pnr_code', pnrCode)
        .maybeSingle();
      
      if (!existing) {
        isUnique = true;
      } else {
        pnrCode = this.generatePNR();
        attempts++;
      }
    }

    if (!isUnique) {
      throw new BadRequestException('Không thể generate PNR code. Vui lòng thử lại.');
    }

    // 2. Tạo booking
    const { data: booking, error: bookingError } = await this.supabaseService.client
      .from('bookings')
      .insert({
        pnr_code: pnrCode,
        user_id: user_id || null,
        contact_fullname,
        contact_phone,
        status: 'HOLD' // Mặc định là HOLD, chờ thanh toán
      })
      .select()
      .single();

    if (bookingError) {
      throw new BadRequestException(`Lỗi tạo booking: ${bookingError.message}`);
    }

    const bookingId = booking.id;

    // 3. Tạo booking segments và passengers, đồng thời tính tổng tiền
    const createdSegments: any[] = [];
    let totalAmount = 0;

    for (const segment of segments) {
      // 3.1. Tạo booking_segment
      const { data: bookingSegment, error: segmentError } = await this.supabaseService.client
        .from('booking_segments')
        .insert({
          booking_id: bookingId,
          flight_instance_id: segment.flight_instance_id,
          fare_bucket_id: segment.fare_bucket_id
        })
        .select()
        .single();

      if (segmentError) {
        // Rollback: xóa booking nếu tạo segment fail
        await this.supabaseService.client
          .from('bookings')
          .delete()
          .eq('id', bookingId);
        throw new BadRequestException(`Lỗi tạo segment: ${segmentError.message}`);
      }

      const segmentId = bookingSegment.id;

      // 3.2. Tính giá vé cho segment này
      const segmentPrice = await this.calculateSegmentPrice(
        segment.flight_instance_id,
        segment.fare_bucket_id,
        segment.passengers
      );
      totalAmount += segmentPrice;

      // 3.3. Tạo passengers cho segment này với số ghế tự động
      const passengerRecords = await this.generateSeatNumbers(
        segment.flight_instance_id,
        segment.passengers
      ).then(seatNumbers => 
        segment.passengers.map((passenger, index) => ({
          booking_segment_id: segmentId,
          full_name: passenger.full_name,
          date_of_birth: passenger.date_of_birth || null,
          id_number: passenger.id_number || null,
          phone: passenger.phone || null,
          email: passenger.email || null,
          passenger_type: passenger.passenger_type,
          seat_number: seatNumbers[index] // Tự động gán số ghế
        }))
      );

      const { data: passengers, error: passengersError } = await this.supabaseService.client
        .from('passengers')
        .insert(passengerRecords)
        .select();

      if (passengersError) {
        // Rollback: xóa booking nếu tạo passengers fail
        await this.supabaseService.client
          .from('bookings')
          .delete()
          .eq('id', bookingId);
        throw new BadRequestException(`Lỗi tạo passengers: ${passengersError.message}`);
      }

      createdSegments.push({
        ...bookingSegment,
        passengers: passengers || [],
        price: segmentPrice
      });
    }

    // 4. Tạo payment record
    const { data: payment, error: paymentError } = await this.supabaseService.client
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: totalAmount,
        currency: 'VND',
        payment_method: 'PENDING', // Chưa chọn phương thức
        status: 'PENDING'
      })
      .select()
      .single();

    if (paymentError) {
      // Rollback: xóa booking nếu tạo payment fail
      await this.supabaseService.client
        .from('bookings')
        .delete()
        .eq('id', bookingId);
      throw new BadRequestException(`Lỗi tạo payment: ${paymentError.message}`);
    }

    // 5. Giảm available seats ngay khi booking thành công (chưa có payment gateway)
    await this.reduceAvailableSeats(bookingId);

    // 6. Cập nhật thống kê airline
    await this.updateAirlineStatistics(createdSegments, totalAmount);

    // 7. Return booking info đầy đủ
    return {
      message: '✅ Tạo booking thành công',
      booking: {
        id: bookingId,
        pnr_code: pnrCode,
        user_id: user_id || null,
        contact_fullname,
        contact_phone,
        status: 'HOLD',
        created_at: booking.created_at,
        segments: createdSegments,
        payment: {
          id: payment.id,
          amount: totalAmount,
          currency: 'VND',
          status: 'PENDING',
          created_at: payment.created_at
        }
      }
    };
  }

  /**
   * Tính giá tiền cho 1 segment dựa trên passengers
   */
  private async calculateSegmentPrice(
    flightInstanceId: string,
    fareBucketId: string,
    passengers: any[]
  ): Promise<number> {
    // Lấy giá cơ bản cho hạng vé này
    const { data: fare } = await this.supabaseService.client
      .from('fares')
      .select('base_price')
      .eq('flight_instance_id', flightInstanceId)
      .eq('fare_bucket_id', fareBucketId)
      .maybeSingle();

    if (!fare) {
      throw new BadRequestException('Không tìm thấy giá vé cho hạng vé này');
    }

    const basePrice = parseFloat(fare.base_price);

    // Tất cả hành khách đều trả cùng giá (không phân biệt ADULT/CHILD/INFANT)
    const totalPassengers = passengers.length;
    const totalPrice = basePrice * totalPassengers;

    return totalPrice;
  }

  /**
   * Giảm số ghế available trong inventories khi booking được tạo thành công
   */
  private async reduceAvailableSeats(bookingId: string) {
    // Lấy tất cả booking segments của booking này
    const { data: segments, error: segmentsError } = await this.supabaseService.client
      .from('booking_segments')
      .select(`
        flight_instance_id,
        fare_bucket_id,
        passengers (id)
      `)
      .eq('booking_id', bookingId);

    if (segmentsError) {
      throw new BadRequestException(`Lỗi lấy segments: ${segmentsError.message}`);
    }

    // Với mỗi segment, giảm available_seats
    for (const segment of segments || []) {
      const passengerCount = segment.passengers?.length || 0;
      
      if (passengerCount > 0) {
        // Tìm inventory record tương ứng
        const { data: inventory, error: invError } = await this.supabaseService.client
          .from('inventories')
          .select('id, available_seats')
          .eq('flight_instance_id', segment.flight_instance_id)
          .eq('fare_bucket_id', segment.fare_bucket_id)
          .single();

        if (invError) {
          console.warn(`Không tìm thấy inventory cho segment ${segment.flight_instance_id}, ${segment.fare_bucket_id}`);
          continue;
        }

        // Giảm available_seats
        const newAvailableSeats = Math.max(0, inventory.available_seats - passengerCount);
        
        const { error: updateError } = await this.supabaseService.client
          .from('inventories')
          .update({ 
            available_seats: newAvailableSeats,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventory.id);

        if (updateError) {
          throw new BadRequestException(`Lỗi cập nhật inventory: ${updateError.message}`);
        }
      }
    }
  }

  /**
   * Cập nhật thống kê airline sau khi booking thành công
   */
  private async updateAirlineStatistics(segments: any[], totalAmount: number) {
    // Group segments by airline để cập nhật thống kê
    const airlineStats = new Map<string, { passengerCount: number; revenue: number }>();

    for (const segment of segments) {
      // Lấy airline_id từ flight_instance
      const { data: flightInstance, error: flightError } = await this.supabaseService.client
        .from('flight_instances')
        .select(`
          flight_number:flight_number_id (
            airline_id
          )
        `)
        .eq('id', segment.flight_instance_id)
        .single();

      if (flightError) {
        console.warn(`Không tìm thấy flight instance ${segment.flight_instance_id}:`, flightError.message);
        continue;
      }

      const airlineId = (flightInstance.flight_number as any)?.airline_id;
      if (!airlineId) {
        console.warn(`Không tìm thấy airline_id cho segment ${segment.id}`);
        continue;
      }

      const passengerCount = segment.passengers?.length || 0;
      const segmentRevenue = segment.price || 0;

      if (airlineStats.has(airlineId)) {
        const existing = airlineStats.get(airlineId)!;
        existing.passengerCount += passengerCount;
        existing.revenue += segmentRevenue;
      } else {
        airlineStats.set(airlineId, {
          passengerCount,
          revenue: segmentRevenue,
        });
      }
    }

    // Cập nhật thống kê cho từng airline
    for (const [airlineId, stats] of airlineStats) {
      try {
        await this.airlineStatisticService.updateStatisticsOnBooking(
          airlineId,
          stats.passengerCount,
          stats.revenue
        );
      } catch (error) {
        console.error(`Lỗi cập nhật thống kê airline ${airlineId}:`, error);
        // Không throw error để không làm fail booking
      }
    }
  }

      /**
       * Lấy thông tin booking đầy đủ với segments và passengers
       */
      async getBookingDetails(bookingId: string) {
        const { data: booking, error } = await this.supabaseService.client
          .from('bookings')
          .select(`
            *,
            booking_segments (
              *,
              flight_instance:flight_instance_id (
                id,
                scheduled_departure_local,
                scheduled_arrival_local,
                flight_number:flight_number_id (
                  code,
                  departure_airport:departure_airport_id (iata_code, city),
                  arrival_airport:arrival_airport_id (iata_code, city),
                  airline:airline_id (name, logo)
                )
              ),
              fare_bucket:fare_bucket_id (code, class),
              passengers (
                id,
                full_name,
                date_of_birth,
                passenger_type,
                phone,
                email
              )
            ),
            payments (
              id,
              amount,
              currency,
              payment_method,
              status,
              transaction_id,
              paid_at,
              created_at
            )
          `)
          .eq('id', bookingId)
          .single();

        if (error) {
          throw new BadRequestException(`Không tìm thấy booking: ${error.message}`);
        }

        return booking;
      }

      /**
       * Lấy thông tin booking đầy đủ cho frontend (bao gồm tất cả chi tiết)
       */
      async getBookingForFrontend(bookingId: string) {
        const { data: booking, error } = await this.supabaseService.client
          .from('bookings')
          .select(`
            id,
            pnr_code,
            user_id,
            contact_fullname,
            contact_phone,
            status,
            created_at,
            updated_at,
            booking_segments (
              id,
              created_at,
              flight_instance:flight_instance_id (
                id,
                scheduled_departure_local,
                scheduled_arrival_local,
                aircraft:aircraft_id (
                  id,
                  type,
                  seat_capacity
                ),
                flight_number:flight_number_id (
                  code,
                  departure_airport:departure_airport_id (
                    id,
                    iata_code,
                    name,
                    city,
                    country
                  ),
                  arrival_airport:arrival_airport_id (
                    id,
                    iata_code,
                    name,
                    city,
                    country
                  ),
                  airline:airline_id (
                    id,
                    name,
                    iata_code,
                    logo
                  )
                )
              ),
              fare_bucket:fare_bucket_id (
                id,
                code,
                class_type,
                description
              ),
              passengers (
                id,
                full_name,
                date_of_birth,
                id_number,
                phone,
                email,
                passenger_type,
                created_at
              )
            ),
            payments (
              id,
              amount,
              currency,
              payment_method,
              status,
              transaction_id,
              paid_at,
              created_at
            )
          `)
          .eq('id', bookingId)
          .single();

        if (error) {
          throw new BadRequestException(`Không tìm thấy booking: ${error.message}`);
        }

        // Tính tổng số hành khách
        const totalPassengers = booking.booking_segments?.reduce((total, segment) => {
          return total + (segment.passengers?.length || 0);
        }, 0) || 0;

        // Tính tổng số segment
        const totalSegments = booking.booking_segments?.length || 0;

        // Tính duration cho mỗi segment
        const segmentsWithDuration = booking.booking_segments?.map((segment: any) => {
          const departure = new Date(segment.flight_instance.scheduled_departure_local);
          const arrival = new Date(segment.flight_instance.scheduled_arrival_local);
          const durationMinutes = Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60));
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;

          return {
            ...segment,
            duration: {
              hours,
              minutes,
              total_minutes: durationMinutes,
              formatted: `${hours}h ${minutes}m`
            }
          };
        });

        return {
          booking: {
            id: booking.id,
            pnr_code: booking.pnr_code,
            user_id: booking.user_id,
            contact_info: {
              fullname: booking.contact_fullname,
              phone: booking.contact_phone
            },
            status: booking.status,
            summary: {
              total_passengers: totalPassengers,
              total_segments: totalSegments,
              is_roundtrip: totalSegments > 1
            },
            created_at: booking.created_at,
            updated_at: booking.updated_at
          },
          segments: segmentsWithDuration,
          payment: booking.payments?.[0] || null
        };
      }

  /**
   * Lấy thông tin booking theo PNR
   */
  async getBookingByPNR(pnrCode: string) {
    const { data: booking, error } = await this.supabaseService.client
      .from('bookings')
      .select(`
        *,
        booking_segments (
          *,
          flight_instance:flight_instance_id (
            id,
            scheduled_departure_local,
            scheduled_arrival_local,
            flight_number:flight_number_id (
              code,
              departure_airport:departure_airport_id (iata_code, city, name),
              arrival_airport:arrival_airport_id (iata_code, city, name),
              airline:airline_id (name, logo, iata_code)
            )
          ),
          fare_bucket:fare_bucket_id (code, class),
          passengers (
            id,
            full_name,
            date_of_birth,
            passenger_type,
            phone,
            email
          )
        ),
        payments (
          id,
          amount,
          currency,
          payment_method,
          status,
          transaction_id,
          paid_at,
          created_at
        )
      `)
      .eq('pnr_code', pnrCode.toUpperCase())
      .single();

    if (error) {
      throw new BadRequestException(`Không tìm thấy booking với PNR: ${pnrCode}`);
    }

    return booking;
  }

  /**
   * Lấy lịch sử đặt vé của người dùng
   */
  async getUserBookingHistory(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
    sortBy?: 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      limit = 20,
      offset = 0,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options || {};

    let query = this.supabaseService.client
      .from('bookings')
      .select(`
        id,
        pnr_code,
        user_id,
        contact_fullname,
        contact_phone,
        status,
        created_at,
        updated_at,
        booking_segments (
          id,
          flight_instance:flight_instance_id (
            id,
            scheduled_departure_local,
            scheduled_arrival_local,
            flight_number:flight_number_id (
              code,
              departure_airport:departure_airport_id (iata_code, city, name),
              arrival_airport:arrival_airport_id (iata_code, city, name),
              airline:airline_id (name, logo, iata_code)
            )
          ),
          fare_bucket:fare_bucket_id (code, class_type, description),
          passengers (
            id,
            full_name,
            passenger_type,
            seat_number
          )
        ),
        payments (
          id,
          amount,
          currency,
          payment_method,
          status,
          paid_at,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      throw new BadRequestException(`Lỗi khi lấy lịch sử đặt vé: ${error.message}`);
    }

    // Format response với thông tin tóm tắt
    const formattedBookings = bookings?.map(booking => {
      const totalPassengers = booking.booking_segments?.reduce((total, segment) => {
        return total + (segment.passengers?.length || 0);
      }, 0) || 0;

      const totalSegments = booking.booking_segments?.length || 0;
      const totalAmount = booking.payments?.[0]?.amount || 0;

      // Lấy thông tin chuyến bay đầu tiên và cuối cùng
      const firstSegment = booking.booking_segments?.[0] as any;
      const lastSegment = booking.booking_segments?.[booking.booking_segments.length - 1] as any;

      return {
        id: booking.id,
        pnr_code: booking.pnr_code,
        status: booking.status,
        summary: {
          total_passengers: totalPassengers,
          total_segments: totalSegments,
          total_amount: totalAmount,
          is_roundtrip: totalSegments > 1,
          departure_airport: firstSegment?.flight_instance?.flight_number?.departure_airport?.iata_code,
          arrival_airport: lastSegment?.flight_instance?.flight_number?.arrival_airport?.iata_code,
          departure_date: firstSegment?.flight_instance?.scheduled_departure_local,
          airline: firstSegment?.flight_instance?.flight_number?.airline?.name
        },
        payment_status: booking.payments?.[0]?.status || 'PENDING',
        created_at: booking.created_at,
        updated_at: booking.updated_at
      };
    }) || [];

    return {
      bookings: formattedBookings,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    };
  }
}
