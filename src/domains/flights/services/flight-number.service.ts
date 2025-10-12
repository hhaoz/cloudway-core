import { Injectable } from '@nestjs/common';
import {CreateFlightNumberDto} from '../dto/create-flight-number.dto';
import {UpdateFlightNumberDto } from '../dto/update-flight-number.dto';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Injectable()
export class FlightNumberService {
  constructor(private supabaseService: SupabaseService) {  }
  async create(createFlightInstanceDto: CreateFlightNumberDto) {
    const {data, error} = await  this.supabaseService.client
      .from('flight_numbers')
      .insert([createFlightInstanceDto])
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
      const {data, error} = await  this.supabaseService.client
      .from('flight_numbers')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const {data, error} = await  this.supabaseService.client
      .from('flight_numbers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateFlightDto: UpdateFlightNumberDto) {
    const {data, error} = await  this.supabaseService.client
      .from('flight_numbers')
      .update(updateFlightDto)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const {data, error} = await  this.supabaseService.client
      .from('flight_numbers')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}

