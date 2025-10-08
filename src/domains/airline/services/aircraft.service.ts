import { Injectable } from '@nestjs/common';
import { CreateAircraftDto } from '../dto/create-aircraft.dto';
import { UpdateAircraftDto } from '../dto/update-aircraft.dto';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Injectable()
export class AircraftService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async findAll() {
   const {data, error} = await this.supabaseService.supabaseClient
       .from('aircrafts')
       .select('*')
     if(error) {
      throw new Error(error.message);
      }
    if(!data) {
      throw new Error('No data found');
    }
    return data;
  }

  async findOne(id: string) {
    const {data, error} = await this.supabaseService.supabaseClient
      .from('aircrafts')
      .select('*')
      .eq('id', id)
      .single()
      if(error) {
        throw new Error(error.message);
      }
      if(!data) {
        throw new Error('No data found');
      }
      return data
  }
  async create(createAircraftDto: CreateAircraftDto) {
    const { data,error} = await this.supabaseService.supabaseClient
        .from('aircrafts')
        .insert(createAircraftDto)
        .select()
        .single()
    if(error) {
      throw new Error(error.message);
    }
    return data
  }

  async update(id: string, updateAircraftDto: UpdateAircraftDto) {
    const {data, error} = await this.supabaseService.supabaseClient
      .from('aircrafts')
      .update(updateAircraftDto)
      .eq('id', id)
      .select()
      .single()
    if(error) {
      throw new Error(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const {data, error} = await this.supabaseService.supabaseClient
      .from('aircrafts')
      .delete()
      .eq('id', id)
      .select()
      .single()
    if(error) {
      throw new Error(error.message);
    }
    return data;
  }
}
