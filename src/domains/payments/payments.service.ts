import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly supabaseService: SupabaseService) {
  }
  async create(createPaymentDto: CreatePaymentDto) {
    const { data, error } = await this.supabaseService.client
      .from('payments')
      .insert(createPaymentDto)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from('payments')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    // Lấy thông tin payment hiện tại để check status cũ
    const { data: currentPayment, error: fetchError } = await this.supabaseService.client
      .from('payments')
      .select('status, booking_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    // Update payment
    const { data, error } = await this.supabaseService.client
      .from('payments')
      .update(updatePaymentDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Nếu payment status chuyển từ PENDING sang PAID, giảm available seats
    if (currentPayment.status === 'PENDING' && updatePaymentDto.status === 'PAID') {
      await this.reduceAvailableSeats(currentPayment.booking_id);
      
      // Cập nhật booking status thành CONFIRMED
      await this.supabaseService.client
        .from('bookings')
        .update({ status: 'CONFIRMED' })
        .eq('id', currentPayment.booking_id);
    }
    
    // Nếu payment status chuyển sang FAILED, có thể restore seats (tùy chọn)
    if (currentPayment.status === 'PENDING' && updatePaymentDto.status === 'FAILED') {
      // Cập nhật booking status thành CANCELLED
      await this.supabaseService.client
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', currentPayment.booking_id);
    }

    return data;
  }

  /**
   * Giảm số ghế available trong inventories khi booking được confirm
   */
  private async reduceAvailableSeats(bookingId: string) {
    // Lấy tất cả booking segments của booking này
    const { data: segments, error: segmentsError } = await this.supabaseService.client
      .from('booking_segments')
      .select(`
        flight_instance_id,
        fare_bucket_id,
        passengers (id)
      `)
      .eq('booking_id', bookingId);

    if (segmentsError) {
      throw new Error(`Lỗi lấy segments: ${segmentsError.message}`);
    }

    // Với mỗi segment, giảm available_seats
    for (const segment of segments || []) {
      const passengerCount = segment.passengers?.length || 0;
      
      if (passengerCount > 0) {
        // Tìm inventory record tương ứng
        const { data: inventory, error: invError } = await this.supabaseService.client
          .from('inventories')
          .select('id, available_seats')
          .eq('flight_instance_id', segment.flight_instance_id)
          .eq('fare_bucket_id', segment.fare_bucket_id)
          .single();

        if (invError) {
          console.warn(`Không tìm thấy inventory cho segment ${segment.flight_instance_id}, ${segment.fare_bucket_id}`);
          continue;
        }

        // Giảm available_seats
        const newAvailableSeats = Math.max(0, inventory.available_seats - passengerCount);
        
        const { error: updateError } = await this.supabaseService.client
          .from('inventories')
          .update({ 
            available_seats: newAvailableSeats,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventory.id);

        if (updateError) {
          throw new Error(`Lỗi cập nhật inventory: ${updateError.message}`);
        }
      }
    }
  }

  /**
   * Restore số ghế available trong inventories khi booking bị cancel
   */
  async restoreAvailableSeats(bookingId: string) {
    // Lấy tất cả booking segments của booking này
    const { data: segments, error: segmentsError } = await this.supabaseService.client
      .from('booking_segments')
      .select(`
        flight_instance_id,
        fare_bucket_id,
        passengers (id)
      `)
      .eq('booking_id', bookingId);

    if (segmentsError) {
      throw new Error(`Lỗi lấy segments: ${segmentsError.message}`);
    }

    // Với mỗi segment, tăng available_seats
    for (const segment of segments || []) {
      const passengerCount = segment.passengers?.length || 0;
      
      if (passengerCount > 0) {
        // Tìm inventory record tương ứng
        const { data: inventory, error: invError } = await this.supabaseService.client
          .from('inventories')
          .select('id, available_seats, total_seats')
          .eq('flight_instance_id', segment.flight_instance_id)
          .eq('fare_bucket_id', segment.fare_bucket_id)
          .single();

        if (invError) {
          console.warn(`Không tìm thấy inventory cho segment ${segment.flight_instance_id}, ${segment.fare_bucket_id}`);
          continue;
        }

        // Tăng available_seats (không vượt quá total_seats)
        const newAvailableSeats = Math.min(inventory.total_seats, inventory.available_seats + passengerCount);
        
        const { error: updateError } = await this.supabaseService.client
          .from('inventories')
          .update({ 
            available_seats: newAvailableSeats,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventory.id);

        if (updateError) {
          throw new Error(`Lỗi cập nhật inventory: ${updateError.message}`);
        }
      }
    }
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('payments')
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
