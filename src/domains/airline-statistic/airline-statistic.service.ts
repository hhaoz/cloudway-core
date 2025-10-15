import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAirlineStatisticDto } from './dto/create-airline-statistic.dto';
import { UpdateAirlineStatisticDto } from './dto/update-airline-statistic.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Injectable()
export class AirlineStatisticService {
  constructor(private readonly supabaseService: SupabaseService) {
  }
  // create(createAirlineStatisticDto: CreateAirlineStatisticDto) {
  //   return 'This action adds a new airlineStatistic';
  // }
  //
  // findAll() {
  //   return `This action returns all airlineStatistic`;
  // }
  //
  // findOne(id: number) {
  //   return `This action returns a #${id} airlineStatistic`;
  // }
  //
  // update(id: number, updateAirlineStatisticDto: UpdateAirlineStatisticDto) {
  //   return `This action updates a #${id} airlineStatistic`;
  // }
  //
  // remove(id: number) {
  //   return `This action removes a #${id} airlineStatistic`;
  // }


  async getAirlineStatisticsById(airlineId: string) {
    // 1) Ensure airline exists (optional but helpful for 404)
    const { data: airline, error: airlineError } = await this.supabaseService.client
      .from('airlines')
      .select('id, name, iata_code')
      .eq('id', airlineId)
      .maybeSingle();

    if (airlineError)
      throw new HttpException(airlineError.message, HttpStatus.BAD_REQUEST);

    if (!airline)
      throw new HttpException('Không tìm thấy hãng bay', HttpStatus.NOT_FOUND);

    // 2) Read from airline_statistics (single row per airline)
    const { data: stats, error: statsError } = await this.supabaseService.client
      .from('airline_statistics')
      .select(`
        id,
        airline_id,
        total_flights,
        total_passengers,
        total_revenue,
        cancelled_flights,
        on_time_flights,
        created_at,
        updated_at
      `)
      .eq('airline_id', airlineId)
      .maybeSingle();

    if (statsError)
      throw new HttpException(statsError.message, HttpStatus.BAD_REQUEST);

    // 3) If no stats yet, return zeroed object
    if (!stats) {
      return {
        airline: {
          id: airline.id,
          name: airline.name,
          iata_code: airline.iata_code,
        },
        statistics: {
          totalFlights: 0,
          totalPassengers: 0,
          totalRevenue: 0,
          cancelledFlights: 0,
          onTimeFlights: 0,
          createdAt: null,
          updatedAt: null,
        },
      };
    }

    // 4) Map to API response
    return {
      airline: {
        id: airline.id,
        name: airline.name,
        iata_code: airline.iata_code,
      },
      statistics: {
        totalFlights: stats.total_flights ?? 0,
        totalPassengers: stats.total_passengers ?? 0,
        totalRevenue: Number(stats.total_revenue ?? 0),
        cancelledFlights: stats.cancelled_flights ?? 0,
        onTimeFlights: stats.on_time_flights ?? 0,
        createdAt: stats.created_at ?? null,
        updatedAt: stats.updated_at ?? null,
      },
    };
  }

}
