import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class AirlineStatisticService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Cập nhật thống kê airline khi có booking mới
   */
  async updateStatisticsOnBooking(airlineId: string, passengerCount: number, revenue: number) {
    // Tìm hoặc tạo record thống kê cho airline
    const { data: existingStat, error: findError } = await this.supabaseService.client
      .from('airline_statistics')
      .select('*')
      .eq('airline_id', airlineId)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Lỗi tìm thống kê airline: ${findError.message}`);
    }

    if (existingStat) {
      // Cập nhật thống kê hiện có
      const { error: updateError } = await this.supabaseService.client
        .from('airline_statistics')
        .update({
          total_passengers: existingStat.total_passengers + passengerCount,
          total_revenue: parseFloat(existingStat.total_revenue) + revenue,
          updated_at: new Date().toISOString(),
        })
        .eq('airline_id', airlineId);

      if (updateError) {
        throw new Error(`Lỗi cập nhật thống kê: ${updateError.message}`);
      }
    } else {
      // Tạo thống kê mới
      const { error: insertError } = await this.supabaseService.client
        .from('airline_statistics')
        .insert({
          airline_id: airlineId,
          total_passengers: passengerCount,
          total_revenue: revenue,
          total_flights: 0,
          cancelled_flights: 0,
          on_time_flights: 0,
        });

      if (insertError) {
        throw new Error(`Lỗi tạo thống kê mới: ${insertError.message}`);
      }
    }
  }

  /**
   * Cập nhật thống kê khi có chuyến bay mới
   */
  async updateStatisticsOnFlight(airlineId: string, isOnTime: boolean = true) {
    const { data: existingStat, error: findError } = await this.supabaseService.client
      .from('airline_statistics')
      .select('*')
      .eq('airline_id', airlineId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw new Error(`Lỗi tìm thống kê airline: ${findError.message}`);
    }

    if (existingStat) {
      const updateData: any = {
        total_flights: existingStat.total_flights + 1,
        updated_at: new Date().toISOString(),
      };

      if (isOnTime) {
        updateData.on_time_flights = existingStat.on_time_flights + 1;
      }

      const { error: updateError } = await this.supabaseService.client
        .from('airline_statistics')
        .update(updateData)
        .eq('airline_id', airlineId);

      if (updateError) {
        throw new Error(`Lỗi cập nhật thống kê chuyến bay: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await this.supabaseService.client
        .from('airline_statistics')
        .insert({
          airline_id: airlineId,
          total_flights: 1,
          on_time_flights: isOnTime ? 1 : 0,
          total_passengers: 0,
          total_revenue: 0,
          cancelled_flights: 0,
        });

      if (insertError) {
        throw new Error(`Lỗi tạo thống kê chuyến bay: ${insertError.message}`);
      }
    }
  }

  /**
   * Cập nhật thống kê khi hủy chuyến bay
   */
  async updateStatisticsOnFlightCancellation(airlineId: string) {
    const { data: existingStat, error: findError } = await this.supabaseService.client
      .from('airline_statistics')
      .select('*')
      .eq('airline_id', airlineId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw new Error(`Lỗi tìm thống kê airline: ${findError.message}`);
    }

    if (existingStat) {
      const { error: updateError } = await this.supabaseService.client
        .from('airline_statistics')
        .update({
          cancelled_flights: existingStat.cancelled_flights + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('airline_id', airlineId);

      if (updateError) {
        throw new Error(`Lỗi cập nhật thống kê hủy chuyến bay: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await this.supabaseService.client
        .from('airline_statistics')
        .insert({
          airline_id: airlineId,
          total_flights: 0,
          on_time_flights: 0,
          total_passengers: 0,
          total_revenue: 0,
          cancelled_flights: 1,
        });

      if (insertError) {
        throw new Error(`Lỗi tạo thống kê hủy chuyến bay: ${insertError.message}`);
      }
    }
  }

  /**
   * Lấy thống kê của airline
   */
  async getAirlineStatistics(airlineId: string) {
    const { data, error } = await this.supabaseService.client
      .from('airline_statistics')
      .select('*')
      .eq('airline_id', airlineId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Lỗi lấy thống kê: ${error.message}`);
    }

    return data || {
      airline_id: airlineId,
      total_flights: 0,
      total_passengers: 0,
      total_revenue: 0,
      cancelled_flights: 0,
      on_time_flights: 0,
    };
  }
}