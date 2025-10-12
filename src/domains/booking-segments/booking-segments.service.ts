import { Injectable } from '@nestjs/common';
import { CreateBookingSegmentDto } from './dto/create-booking-segment.dto';
import { UpdateBookingSegmentDto } from './dto/update-booking-segment.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class BookingSegmentsService {
  constructor(private readonly supabaseService: SupabaseService) {
  }
  async create(createBookingSegmentDto: CreateBookingSegmentDto) {
    const { data, error } = await this.supabaseService.client
      .from('booking_segments')
      .insert(createBookingSegmentDto)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from('booking_segments')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('booking_segments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateBookingSegmentDto: UpdateBookingSegmentDto) {
    const { data, error } = await this.supabaseService.client
      .from('booking_segments')
      .update(updateBookingSegmentDto)
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('booking_segments')
      .delete()
      .eq('id', id)
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
