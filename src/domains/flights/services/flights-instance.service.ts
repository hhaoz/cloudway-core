import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFlightInstanceDto } from '../dto/create-flight-instance.dto';
import { UpdateFlightInstanceDto } from '../dto/update-flight-instance.dto';
import { SearchFlightsDto } from '../dto/search-flights.dto';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Injectable()
export class FlightsInstanceService {
  constructor(private readonly supabaseService: SupabaseService) {
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
        scheduled_departure_local,
        scheduled_arrival_local,
        flight_number:flight_number_id (
          code,
          departure_airport:departure_airport_id (iata_code, city),
          arrival_airport:arrival_airport_id (iata_code, city)
        )
      `)
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

    // 4️⃣ Tạo fares & inventories tương ứng
    const fareRows = fares.map((f) => ({
      flight_instance_id: flightInstanceId,
      fare_bucket_id: f.fare_bucket_id,
      passenger_type: f.passenger_type,
      base_price: f.base_price
    }));

    const inventoryRows = fares.map((f) => ({
      flight_instance_id: flightInstanceId,
      fare_bucket_id: f.fare_bucket_id,
      available_seats: f.total_seats,
      total_seats: f.total_seats
    }));

    const { error: fareError } = await this.supabaseService.client.from('fares').insert(fareRows);
    if (fareError) throw new BadRequestException(fareError.message);

    const { error: invError } = await this.supabaseService.client
      .from('inventories')
      .insert(inventoryRows);
    if (invError) throw new BadRequestException(invError.message);

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
        ),
        aircraft:aircraft_id (
          id,
          type,
          seat_capacity
        )
      `)
      .eq('flight_number.departure_airport_id', departureAirportId)
      .eq('flight_number.arrival_airport_id', arrivalAirportId)
      .gte('scheduled_departure_local', startOfDay)
      .lt('scheduled_departure_local', nextDay)
      .order('scheduled_departure_local', { ascending: true });

    if (error) {
      console.error('Error finding flights:', error);
      return [];
    }

    // Lọc những chuyến bay còn đủ ghế
    const flightsWithAvailability = await Promise.all(
      (flights || []).map(async (flight) => {
        const availability = await this.checkSeatAvailability(flight.id, minSeats);
        return {
          ...flight,
          has_available_seats: availability.hasEnoughSeats,
          available_seats: availability.totalAvailable,
          fare_buckets: availability.fareBuckets
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
    
    // Nếu không có inventory, coi như có đủ ghế (chuyến bay mới chưa setup)
    const hasInventory = inventories && inventories.length > 0;
    const hasEnoughSeats = hasInventory ? totalAvailable >= requiredSeats : true;
    
    return {
      hasEnoughSeats,
      totalAvailable: hasInventory ? totalAvailable : 999, // Default nếu chưa có inventory
      fareBuckets: inventories || []
    };
  }

  /**
   * Tính tổng giá cho chuyến bay
   */
  private async calculateFlightPrice(flight: any, adults: number, children: number, infants: number) {
    const { data: fares } = await this.supabaseService.client
      .from('fares')
      .select('passenger_type, base_price, fare_bucket_id')
      .eq('flight_instance_id', flight.id);

    if (!fares || fares.length === 0) {
      return {
        ...flight,
        pricing: {
          adult_price: 0,
          child_price: 0,
          infant_price: 0,
          total_price: 0
        }
      };
    }

    const adultFares = fares.filter(f => f.passenger_type === 'ADULT');
    const childFares = fares.filter(f => f.passenger_type === 'CHILD');
    const infantFares = fares.filter(f => f.passenger_type === 'INFANT');

    const minAdultPrice = adultFares.length > 0 
      ? Math.min(...adultFares.map(f => f.base_price)) 
      : 0;
    const minChildPrice = childFares.length > 0 
      ? Math.min(...childFares.map(f => f.base_price)) 
      : minAdultPrice * 0.75;
    const minInfantPrice = infantFares.length > 0 
      ? Math.min(...infantFares.map(f => f.base_price)) 
      : minAdultPrice * 0.1;

    const totalPrice = 
      (minAdultPrice * adults) + 
      (minChildPrice * children) + 
      (minInfantPrice * infants);

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
      pricing: {
        adult_price: minAdultPrice,
        child_price: minChildPrice,
        infant_price: minInfantPrice,
        total_price: totalPrice,
        currency: 'VND',
        breakdown: {
          adults: adults > 0 ? { count: adults, unit_price: minAdultPrice, total: minAdultPrice * adults } : null,
          children: children > 0 ? { count: children, unit_price: minChildPrice, total: minChildPrice * children } : null,
          infants: infants > 0 ? { count: infants, unit_price: minInfantPrice, total: minInfantPrice * infants } : null
        }
      },
      fare_buckets: flight.fare_buckets || []
    };
  }
}
