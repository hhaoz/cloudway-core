import { Injectable } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class InventoriesService {
  constructor(private readonly supabaseService: SupabaseService) {
  }
  async create(createInventoryDto: CreateInventoryDto) {
    const { data, error } = await this.supabaseService.client
      .from('inventories')
      .insert(createInventoryDto)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from('inventories')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('inventories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    const { data, error } = await this.supabaseService.client
      .from('inventories')
      .update(updateInventoryDto)
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('inventories')
      .delete()
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
