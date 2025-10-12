import { Injectable } from '@nestjs/common';
import { CreateTaxesFeeDto } from './dto/create-taxes_fee.dto';
import { UpdateTaxesFeeDto } from './dto/update-taxes_fee.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class TaxesFeesService {
  constructor(private readonly supabaseService: SupabaseService) {
  }
  async create(createTaxesFeeDto: CreateTaxesFeeDto) {
    const { data, error } = await this.supabaseService.client
      .from('taxes_fees')
      .insert(createTaxesFeeDto)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from('taxes_fees')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('taxes_fees')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateTaxesFeeDto: UpdateTaxesFeeDto) {
    const { data, error } = await this.supabaseService.client
      .from('taxes_fees')
      .update(updateTaxesFeeDto)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('taxes_fees')
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
