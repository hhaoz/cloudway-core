import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFlightInstanceDto } from '../dto/create-flight-instance.dto';
import { UpdateFlightInstanceDto } from '../dto/update-flight-instance.dto';
import { UpdateFlightScheduleDto } from '../dto/update-flight-schedule.dto';
import { UpdateFlightStatusDto } from '../dto/update-flight-status.dto';
import { SearchFlightsDto } from '../dto/search-flights.dto';
import { FilterFlightsByStatusDto } from '../dto/filter-flights-by-status.dto';
import { FlightStatus } from '../../../common/enums/flight-status.enum';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { AirlineStatisticService } from '../../airline-statistic/airline-statistic.service';

@Injectable()
export class FlightsInstanceService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly airlineStatisticService: AirlineStatisticService
  ) {
  }
  async create(createFlightInstanceDto: CreateFlightInstanceDto) {
    const {data,error} = await this.supabaseService.client
      .from("flight_instances")
      .insert(createFlightInstanceDto)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const {data,error} = await this.supabaseService.client
      .from("flight_instances")
      .select(`
        id,
        status,
        scheduled_departure_local,
        scheduled_arrival_local,
        flight_number:flight_number_id (
          code,
          departure_airport:departure_airport_id (iata_code, city),
          arrival_airport:arrival_airport_id (iata_code, city)
        )
      `)
      .neq('status', FlightStatus.CANCELLED) // Lọc ra các chuyến bay đã bị hủy
      .order('scheduled_departure_local', { ascending: false }) // Sắp xếp theo thời gian bay từ mới đến cũ
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const {data,error} = await this.supabaseService.client
      .from("flight_instances")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Lấy tất cả flight_instances theo airline_id
   */
  async findByAirline(airlineId: string) {
    const { data, error } = await this.supabaseService.client
      .from('flight_instances')
      .select(`
        id,
        scheduled_departure_local,
        scheduled_arrival_local,
        created_at,
        status,
        flight_number:flight_number_id!inner (
          id,
          code,
          airline_id,
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
        ),
        aircraft:aircraft_id (
          id,
          type,
          seat_capacity
        )
      `)
      .eq('flight_number.airline_id', airlineId)
      .order('scheduled_departure_local', { ascending: false }); // Sắp xếp theo thời gian bay từ mới đến cũ

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateFlightDto: UpdateFlightInstanceDto) {
    const {data, error} = await this.supabaseService.client
      .from("flight_instances")
      .update(updateFlightDto)
      .eq("id", id)
      .select()
      .single();
    if (error) {
        throw new Error(error.message);
    }
    return data;
  }

  /**
   * Cập nhật status của chuyến bay
   */
  async updateStatus(id: string, updateStatusDto: UpdateFlightStatusDto) {
    const { data, error } = await this.supabaseService.client
      .from("flight_instances")
      .update({
        status: updateStatusDto.status,
        actual_departure_local: updateStatusDto.actual_departure_local,
        actual_arrival_local: updateStatusDto.actual_arrival_local,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Lỗi khi cập nhật status: ${error.message}`);
    }

    // Cập nhật thống kê airline khi status thay đổi
    await this.updateAirlineStatisticsOnStatusChange(id, updateStatusDto.status);

    return {
      message: 'Cập nhật status chuyến bay thành công',
      data
    };
  }

  /**
   * Cập nhật lịch trình (giờ đi và giờ đến) của chuyến bay
   */
  async updateSchedule(id: string, updateScheduleDto: UpdateFlightScheduleDto) {
    const { scheduled_departure_local, scheduled_arrival_local } = updateScheduleDto;

    // Kiểm tra xem chuyến bay có tồn tại không
    const { data: existingFlight, error: checkError } = await this.supabaseService.client
      .from('flight_instances')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingFlight) {
      throw new NotFoundException(`Không tìm thấy chuyến bay với ID: ${id}`);
    }

    // Validate thời gian: giờ đến phải sau giờ đi
    const departureTime = new Date(scheduled_departure_local);
    const arrivalTime = new Date(scheduled_arrival_local);

    if (arrivalTime <= departureTime) {
      throw new BadRequestException('Giờ đến phải sau giờ đi');
    }

    // Cập nhật lịch trình
    const { data, error } = await this.supabaseService.client
      .from('flight_instances')
      .update({
        scheduled_departure_local,
        scheduled_arrival_local,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        scheduled_departure_local,
        scheduled_arrival_local,
        updated_at,
        flight_number:flight_number_id (
          code,
          departure_airport:departure_airport_id (iata_code, city),
          arrival_airport:arrival_airport_id (iata_code, city)
        )
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Lỗi khi cập nhật lịch trình: ${error.message}`);
    }

    return {
      message: 'Cập nhật lịch trình chuyến bay thành công',
      data
    };
  }

  async remove(id: string) {
    const {data,error} = await this.supabaseService.client
      .from("flight_instances")
      .delete()
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Hủy chuyến bay chỉ khi chưa có ai đặt vé - cập nhật trạng thái thành CANCELLED
   */
  async cancelFlight(id: string) {
    // 1. Kiểm tra xem chuyến bay có tồn tại không
    const { data: existingFlight, error: checkError } = await this.supabaseService.client
      .from('flight_instances')
      .select(`
        id,
        status,
        scheduled_departure_local,
        scheduled_arrival_local,
        flight_number:flight_number_id (
          code,
          airline_id,
          departure_airport:departure_airport_id (iata_code, city),
          arrival_airport:arrival_airport_id (iata_code, city)
        )
      `)
      .eq('id', id)
      .single();

    if (checkError || !existingFlight) {
      throw new NotFoundException(`Không tìm thấy chuyến bay với ID: ${id}`);
    }

    // 2. Kiểm tra trạng thái hiện tại
    if (existingFlight.status === FlightStatus.CANCELLED) {
      throw new BadRequestException('Chuyến bay đã được hủy trước đó');
    }

    // 3. Kiểm tra xem có ai đã đặt vé cho chuyến bay này chưa
    const { data: existingBookings, error: bookingError } = await this.supabaseService.client
      .from('booking_segments')
      .select('id, booking_id')
      .eq('flight_instance_id', id);

    if (bookingError) {
      throw new BadRequestException(`Lỗi khi kiểm tra đặt vé: ${bookingError.message}`);
    }

    if (existingBookings && existingBookings.length > 0) {
      throw new BadRequestException(
        `Không thể hủy chuyến bay vì đã có ${existingBookings.length} booking(s) được đặt cho chuyến bay này. Chỉ có thể hủy chuyến bay khi chưa có ai đặt vé.`
      );
    }

    // 4. Cập nhật trạng thái chuyến bay thành CANCELLED
    const { data, error } = await this.supabaseService.client
      .from('flight_instances')
      .update({
        status: FlightStatus.CANCELLED,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        status,
        scheduled_departure_local,
        scheduled_arrival_local,
        updated_at,
        flight_number:flight_number_id (
          code,
          departure_airport:departure_airport_id (iata_code, city),
          arrival_airport:arrival_airport_id (iata_code, city)
        )
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Lỗi khi hủy chuyến bay: ${error.message}`);
    }

    // Cập nhật thống kê airline: tăng cancelled_flights
    try {
      const airlineId = (existingFlight.flight_number as any)?.airline_id;
      if (airlineId) {
        await this.airlineStatisticService.updateStatisticsOnFlightCancellation(airlineId);
      }
    } catch (statsError) {
      console.error('Lỗi cập nhật thống kê airline khi hủy chuyến bay:', statsError);
      // Không throw error để không ảnh hưởng đến việc hủy chuyến bay
    }

    return {
      message: 'Hủy chuyến bay thành công',
      cancelled_flight: data
    };
  }

  async createFlight(dto: CreateFlightInstanceDto) {
    const {
      airline_id,
      flight_number,
      aircraft_id,
      scheduled_departure_local,
      scheduled_arrival_local,
      fares
    } = dto;

    // 1️⃣ Kiểm tra xem flight_number.code đã tồn tại chưa
    const { data: existingFlightNumber } = await this.supabaseService.client
      .from('flight_numbers')
      .select('id')
      .eq('code', flight_number.code)
      .maybeSingle();

    let flightNumberId = existingFlightNumber?.id;

    // 2️⃣ Nếu chưa có, tạo flight_number mới
    if (!flightNumberId) {
      const { data: newFlightNumber, error: fnError } = await this.supabaseService.client
        .from('flight_numbers')
        .insert([
          {
            code: flight_number.code,
            departure_airport_id: flight_number.departure_airport_id,
            arrival_airport_id: flight_number.arrival_airport_id,
            airline_id // nếu bạn thêm cột này vào flight_numbers (khuyến nghị)
          }
        ])
        .select()
        .single();

      if (fnError) throw new BadRequestException(fnError.message);
      flightNumberId = newFlightNumber.id;
    }

    // 3️⃣ Tạo flight_instance
    const { data: newInstance, error: fiError } = await this.supabaseService.client
      .from('flight_instances')
      .insert([
        {
          flight_number_id: flightNumberId,
          aircraft_id,
          scheduled_departure_local,
          scheduled_arrival_local
        }
      ])
      .select()
      .single();

    if (fiError) throw new BadRequestException(fiError.message);

    const flightInstanceId = newInstance.id;

    // 4️⃣ Lấy seat_capacity từ aircraft
    const { data: aircraft } = await this.supabaseService.client
      .from('aircrafts')
      .select('seat_capacity')
      .eq('id', aircraft_id)
      .single();

    if (!aircraft) {
      throw new BadRequestException('Không tìm thấy thông tin máy bay');
    }

    const totalSeats = aircraft.seat_capacity;

    // 5️⃣ Tạo fares & inventories tương ứng
    const fareRows = fares.map((f) => ({
      flight_instance_id: flightInstanceId,
      fare_bucket_id: f.fare_bucket_id,
      base_price: f.base_price
    }));

    const inventoryRows = fares.map((f) => ({
      flight_instance_id: flightInstanceId,
      fare_bucket_id: f.fare_bucket_id,
      available_seats: totalSeats, // Sử dụng seat_capacity của aircraft
      total_seats: totalSeats      // Sử dụng seat_capacity của aircraft
    }));

    const { error: fareError } = await this.supabaseService.client.from('fares').insert(fareRows);
    if (fareError) throw new BadRequestException(fareError.message);

    const { error: invError } = await this.supabaseService.client
      .from('inventories')
      .insert(inventoryRows);
    if (invError) throw new BadRequestException(invError.message);

    // Cập nhật thống kê airline: tăng total_flights và on_time_flights
    // (coi như chuyến bay mới tạo là đúng giờ vì chưa có logic kiểm tra delay)
    try {
      await this.airlineStatisticService.updateStatisticsOnFlight(airline_id, true);
    } catch (statsError) {
      console.error('Lỗi cập nhật thống kê airline:', statsError);
      // Không throw error để không ảnh hưởng đến việc tạo chuyến bay
    }

    return {
      message: 'Flight created successfully',
      flight_instance_id: flightInstanceId
    };
  }

  /**
   * Tìm kiếm chuyến bay
   */
  async searchFlights(searchDto: SearchFlightsDto) {
    const {
      departure_airport_id,
      destination_airport_id,
      departure_date,
      return_date,
      trip_type,
      adults,
      children,
      infants
    } = searchDto;

    const totalPassengers = adults + children + infants;

    // Tìm chuyến bay đi (outbound)
    const outboundFlights = await this.findFlightsByRoute(
      departure_airport_id,
      destination_airport_id,
      departure_date,
      totalPassengers
    );

    // Nếu roundtrip, tìm chuyến về (return)
    let returnFlights: any[] = [];
    if (trip_type === 'roundtrip' && return_date) {
      returnFlights = await this.findFlightsByRoute(
        destination_airport_id,
        departure_airport_id,
        return_date,
        totalPassengers
      );
    }

    // Tính tổng giá cho từng chuyến bay
    const outboundWithPrices = await Promise.all(
      outboundFlights.map(flight => this.calculateFlightPrice(flight, adults, children, infants))
    );

    const returnWithPrices = trip_type === 'roundtrip' && return_date
      ? await Promise.all(
          returnFlights.map(flight => this.calculateFlightPrice(flight, adults, children, infants))
        )
      : [];

    return {
      trip_type,
      passengers: {
        adults,
        children,
        infants,
        total: totalPassengers
      },
      outbound: {
        departure_date,
        flights: outboundWithPrices
      },
      return: trip_type === 'roundtrip' && return_date ? {
        departure_date: return_date,
        flights: returnWithPrices
      } : null
    };
  }

  /**
   * Tìm chuyến bay theo tuyến đường và ngày
   */
  private async findFlightsByRoute(
    departureAirportId: string,
    arrivalAirportId: string,
    date: string,
    minSeats: number
  ) {
    // Tính ngày bắt đầu và ngày kết thúc để tìm chuyến bay trong ngày
    const startDate = new Date(date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const startOfDay = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const nextDay = nextDate.toISOString().split('T')[0];     // YYYY-MM-DD

    const { data: flights, error } = await this.supabaseService.client
      .from('flight_instances')
      .select(`
        id,
        scheduled_departure_local,
        scheduled_arrival_local,
        flight_number:flight_number_id!inner (
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
        ),
        aircraft:aircraft_id (
          id,
          type,
          seat_capacity
        )
      `)
      .eq('flight_number.departure_airport_id', departureAirportId)
      .eq('flight_number.arrival_airport_id', arrivalAirportId)
      .neq('status', FlightStatus.CANCELLED) // Lọc ra các chuyến bay đã bị hủy
      .gte('scheduled_departure_local', startOfDay)
      .lt('scheduled_departure_local', nextDay)
      .order('scheduled_departure_local', { ascending: true });

    if (error) {
      console.error('Error finding flights:', error);
      return [];
    }

        // Lọc những chuyến bay còn đủ ghế và thêm thông tin giá
        const flightsWithAvailability = await Promise.all(
          (flights || []).map(async (flight) => {
            const availability = await this.checkSeatAvailability(flight.id, minSeats);
            
            // Lấy thông tin giá cho chuyến bay này
            const { data: fares, error: faresError } = await this.supabaseService.client
              .from('fares')
              .select(`
                base_price,
                fare_bucket:fare_bucket_id (
                  id,
                  code,
                  class_type,
                  description
                )
              `)
              .eq('flight_instance_id', flight.id);


            return {
              ...flight,
              has_available_seats: availability.hasEnoughSeats,
              available_seats: availability.totalAvailable,
              total_seats: availability.totalSeats,
              fare_buckets: availability.fareBuckets,
              fares: fares || []
            };
          })
        );

    return flightsWithAvailability.filter(f => f.has_available_seats);
  }

  /**
   * Kiểm tra số ghế còn trống
   */
  private async checkSeatAvailability(flightInstanceId: string, requiredSeats: number) {
    const { data: inventories } = await this.supabaseService.client
      .from('inventories')
      .select(`
        fare_bucket_id,
        available_seats,
        total_seats,
        fare_bucket:fare_bucket_id (
          code,
          class,
          description
        )
      `)
      .eq('flight_instance_id', flightInstanceId);

    const totalAvailable = (inventories || []).reduce((sum, inv) => sum + inv.available_seats, 0);
    const totalSeats = (inventories || []).reduce((sum, inv) => sum + inv.total_seats, 0);
    
    // Nếu không có inventory, lấy seat_capacity từ aircraft
    const hasInventory = inventories && inventories.length > 0;
    let actualAvailableSeats = totalAvailable;
    let actualTotalSeats = totalSeats;
    
    if (!hasInventory) {
      // Lấy seat_capacity từ aircraft nếu không có inventory
      const { data: flightInstance } = await this.supabaseService.client
        .from('flight_instances')
        .select(`
          aircraft:aircraft_id (
            seat_capacity
          )
        `)
        .eq('id', flightInstanceId)
        .single();
      
      actualTotalSeats = (flightInstance?.aircraft as any)?.seat_capacity || 0;
      actualAvailableSeats = actualTotalSeats; // Nếu chưa có inventory, coi như tất cả ghế còn trống
    }
    
    const hasEnoughSeats = actualAvailableSeats >= requiredSeats;
    
    return {
      hasEnoughSeats,
      totalAvailable: actualAvailableSeats,
      totalSeats: actualTotalSeats,
      fareBuckets: inventories || []
    };
  }

  /**
   * Tính tổng giá cho chuyến bay
   */
  private async calculateFlightPrice(flight: any, adults: number, children: number, infants: number) {
    // Sử dụng thông tin fares đã có sẵn từ findFlightsByRoute
    const fares = flight.fares || [];

    if (!fares || fares.length === 0) {
      return {
        ...flight,
        fares: [], // ✅ THÊM DÒNG NÀY
        pricing: {
          base_price: 0,
          total_passengers: adults + children + infants,
          total_price: 0,
          currency: 'VND',
          breakdown: {
            adults: adults > 0 ? { count: adults, unit_price: 0, total: 0 } : null,
            children: children > 0 ? { count: children, unit_price: 0, total: 0 } : null,
            infants: infants > 0 ? { count: infants, unit_price: 0, total: 0 } : null
          }
        }
      };
    }

    // Lấy giá của hạng phổ thông (Economy) làm giá mặc định
    const economyFare = fares.find(f => 
      f.fare_bucket?.class_type?.toLowerCase().includes('economy') ||
      f.fare_bucket?.code?.toLowerCase().includes('eco') ||
      f.fare_bucket?.description?.toLowerCase().includes('economy')
    );
    
    // Nếu không tìm thấy Economy, lấy giá thấp nhất
    const defaultPrice = economyFare ? economyFare.base_price : Math.min(...fares.map(f => f.base_price));
    
    // Tất cả hành khách đều trả cùng giá (không phân biệt ADULT/CHILD/INFANT)
    const totalPassengers = adults + children + infants;
    const totalPrice = defaultPrice * totalPassengers;

    const departure = new Date(flight.scheduled_departure_local);
    const arrival = new Date(flight.scheduled_arrival_local);
    const durationMinutes = Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return {
      flight_id: flight.id,
      flight_number: flight.flight_number?.code,
      airline: {
        id: flight.flight_number?.airline?.id,
        name: flight.flight_number?.airline?.name,
        code: flight.flight_number?.airline?.iata_code,
        logo: flight.flight_number?.airline?.logo
      },
      departure: {
        airport: flight.flight_number?.departure_airport,
        time: flight.scheduled_departure_local
      },
      arrival: {
        airport: flight.flight_number?.arrival_airport,
        time: flight.scheduled_arrival_local
      },
      duration: {
        hours,
        minutes,
        total_minutes: durationMinutes,
        formatted: `${hours}h ${minutes}m`
      },
      aircraft: flight.aircraft,
      status: flight.status || 'SCHEDULED',
      available_seats: flight.available_seats,
      total_seats: flight.total_seats,
      fares: fares, // ✅ THÊM DÒNG NÀY
      pricing: {
        base_price: defaultPrice,
        total_passengers: totalPassengers,
        total_price: totalPrice,
        currency: 'VND',
        breakdown: {
          adults: adults > 0 ? { count: adults, unit_price: defaultPrice, total: defaultPrice * adults } : null,
          children: children > 0 ? { count: children, unit_price: defaultPrice, total: defaultPrice * children } : null,
          infants: infants > 0 ? { count: infants, unit_price: defaultPrice, total: defaultPrice * infants } : null
        }
      },
      fare_buckets: flight.fare_buckets || []
    };
  }

  /**
   * Lọc chuyến bay theo status
   */
  async filterByStatus(filterDto: FilterFlightsByStatusDto) {
    const { status } = filterDto;

    const { data, error } = await this.supabaseService.client
      .from('flight_instances')
      .select(`
        id,
        status,
        scheduled_departure_local,
        scheduled_arrival_local,
        created_at,
        updated_at,
        flight_number:flight_number_id (
          id,
          code,
          airline_id,
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
        ),
        aircraft:aircraft_id (
          id,
          type,
          seat_capacity
        )
      `)
      .eq('status', status)
      .order('scheduled_departure_local', { ascending: false });

    if (error) {
      throw new BadRequestException(`Lỗi khi lọc chuyến bay: ${error.message}`);
    }

    return {
      status,
      total_flights: data?.length || 0,
      flights: data || []
    };
  }

  /**
   * Helper method: Cập nhật thống kê airline khi chuyến bay thay đổi status
   */
  private async updateAirlineStatisticsOnStatusChange(flightInstanceId: string, newStatus: FlightStatus) {
    try {
      // Lấy thông tin chuyến bay để có airline_id
      const { data: flight } = await this.supabaseService.client
        .from('flight_instances')
        .select(`
          flight_number:flight_number_id (
            airline_id
          )
        `)
        .eq('id', flightInstanceId)
        .single();

      const flightNumber = flight?.flight_number as any;
      if (!flightNumber?.airline_id) {
        console.warn(`Không tìm thấy airline_id cho flight_instance: ${flightInstanceId}`);
        return;
      }

      const airlineId = flightNumber.airline_id;

      // Cập nhật thống kê dựa trên status mới
      switch (newStatus) {
        case FlightStatus.DEPARTED:
        case FlightStatus.ARRIVED:
          // Có thể thêm logic kiểm tra delay ở đây trong tương lai
          // Hiện tại coi như tất cả chuyến bay đều đúng giờ
          await this.airlineStatisticService.updateStatisticsOnFlight(airlineId, true);
          break;
        case FlightStatus.CANCELLED:
          await this.airlineStatisticService.updateStatisticsOnFlightCancellation(airlineId);
          break;
        default:
          // Không cần cập nhật thống kê cho SCHEDULED
          break;
      }
    } catch (error) {
      console.error('Lỗi cập nhật thống kê airline khi thay đổi status:', error);
      // Không throw error để không ảnh hưởng đến business logic chính
    }
  }
}
