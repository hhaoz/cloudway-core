import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class TicketsService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async create(createTicketDto: CreateTicketDto) {
    const { data, error } = await this.supabaseService.client
      .from('tickets')
      .insert(createTicketDto)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from('tickets')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    const { data, error } = await this.supabaseService.client
      .from('tickets')
      .update(updateTicketDto)
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('tickets')
      .delete()
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
