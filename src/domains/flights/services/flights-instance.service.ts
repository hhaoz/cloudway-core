import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFlightInstanceDto } from '../dto/create-flight-instance.dto';
import { UpdateFlightInstanceDto } from '../dto/update-flight-instance.dto';
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
}
