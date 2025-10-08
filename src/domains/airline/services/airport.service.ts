import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { CreateAirportDto } from '../dto/create-airport.dto';
import { UpdateAirportDto } from '../dto/update-airport.dto';

@Injectable()
export class AirportService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async create(createAirportDto: CreateAirportDto) {
    const { data, error } = await this.supabaseService.supabaseClient
      .from('airports')
      .insert(createAirportDto)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabaseService.supabaseClient
      .from('airports')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('No data found');
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.supabaseClient
      .from('airports')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('No data found');
    }
    return data;
  }
  async update(id: string, updateAirportDto: UpdateAirportDto) {
    const { data, error } = await this.supabaseService.supabaseClient
      .from('airports')
      .update(updateAirportDto)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
  }
  async remove(id: string) {
    const { data, error } = await this.supabaseService.supabaseClient
      .from('airports')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
  }
}
