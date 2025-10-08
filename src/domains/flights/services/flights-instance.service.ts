import { Injectable } from '@nestjs/common';
import { CreateFlightInstanceDto } from '../dto/create-flight-instance.dto';
import { UpdateFlightInstanceDto } from '../dto/update-flight-instance.dto';
import { SupabaseService } from '../../../services/supabase/supabase.service';
@Injectable()
export class FlightsInstanceService {
  constructor(private readonly supabaseService: SupabaseService) {
  }
  async create(createFlightInstanceDto: CreateFlightInstanceDto) {
    const {data,error} = await this.supabaseService.supabaseClient
      .from("flight_instances")
      .insert(createFlightInstanceDto)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const {data,error} = await this.supabaseService.supabaseClient
      .from("flight_instances")
      .select("*");
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const {data,error} = await this.supabaseService.supabaseClient
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
    const {data, error} = await this.supabaseService.supabaseClient
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
    const {data,error} = await this.supabaseService.supabaseClient
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
}
