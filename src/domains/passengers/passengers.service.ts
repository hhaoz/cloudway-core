import { Injectable } from '@nestjs/common';
import { CreatePassengerDto } from './dto/create-passenger.dto';
import { UpdatePassengerDto } from './dto/update-passenger.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class PassengersService {
  constructor(private readonly supabaseService: SupabaseService) {
  }
  async create(createPassengerDto: CreatePassengerDto) {
    const {data,error} = await this.supabaseService.client
      .from('passengers')
      .insert(createPassengerDto)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findAll() {
    const {data,error} = await this.supabaseService.client
      .from('passengers')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findOne(id: string) {
    const {data,error} = await this.supabaseService.client
      .from('passengers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(id: string, updatePassengerDto: UpdatePassengerDto) {
    const {data,error} = await this.supabaseService.client
      .from('passengers')
      .update(updatePassengerDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async remove(id: string) {
    const {data,error} = await this.supabaseService.client
      .from('passengers')
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
