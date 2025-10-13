import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreateBookingWithPassengersDto } from './dto/create-booking-with-passengers.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class BookingsService {
  constructor(private readonly supabaseService: SupabaseService) {
  }

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

      // 3.3. Tạo passengers cho segment này
      const passengerRecords = segment.passengers.map(passenger => ({
        booking_segment_id: segmentId,
        full_name: passenger.full_name,
        date_of_birth: passenger.date_of_birth || null,
        id_number: passenger.id_number || null,
        phone: passenger.phone || null,
        email: passenger.email || null,
        passenger_type: passenger.passenger_type
      }));

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

    // 5. Return booking info đầy đủ
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
    // Group passengers theo type
    const passengerCounts = {
      ADULT: passengers.filter(p => p.passenger_type === 'ADULT').length,
      CHILD: passengers.filter(p => p.passenger_type === 'CHILD').length,
      INFANT: passengers.filter(p => p.passenger_type === 'INFANT').length
    };

    let totalPrice = 0;

    // Lấy giá cho từng loại passenger
    for (const [passengerType, count] of Object.entries(passengerCounts)) {
      if (count === 0) continue;

      const { data: fare } = await this.supabaseService.client
        .from('fares')
        .select('base_price')
        .eq('flight_instance_id', flightInstanceId)
        .eq('fare_bucket_id', fareBucketId)
        .eq('passenger_type', passengerType)
        .maybeSingle();

      if (fare) {
        totalPrice += parseFloat(fare.base_price) * count;
      } else {
        // Nếu không tìm thấy giá cụ thể, có thể throw error hoặc dùng giá default
        throw new BadRequestException(
          `Không tìm thấy giá vé cho ${passengerType} trên chuyến bay này`
        );
      }
    }

    return totalPrice;
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
}
