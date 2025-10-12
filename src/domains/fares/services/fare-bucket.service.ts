import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { CreateFareBucketDto } from '../dto/create-fare-bucket.dto';
import { UpdateFareBucketDto } from '../dto/update-fare-bucket.dto';
@Injectable()
export class FareBucketService {
  constructor(private readonly supabaseService:SupabaseService){  }

  async create(createFareBucketDto: CreateFareBucketDto) {
    const { data, error } = await this.supabaseService.client
      .from('fare_buckets')
      .insert(createFareBucketDto)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from('fare_buckets')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('fare_buckets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateFareBucketDto: UpdateFareBucketDto) {
    const { data, error } = await this.supabaseService.client
      .from('fare_buckets')
      .update(updateFareBucketDto)
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('fare_buckets')
      .delete()
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
