import { Injectable } from '@nestjs/common';
import { CreateFareDto } from '../dto/create-fare.dto';
import { UpdateFareDto } from '../dto/update-fare.dto';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Injectable()
export class FaresService {
  constructor(private supabaseService:SupabaseService) {}
  async create(createFareDto: CreateFareDto) {
    const { data, error } = await this.supabaseService.client
      .from('fares')
      .insert(createFareDto)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from('fares')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('fares')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateFareDto: UpdateFareDto) {
    const { data, error } = await this.supabaseService.client
      .from('fares')
      .update(updateFareDto)
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('fares')
      .delete()
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
