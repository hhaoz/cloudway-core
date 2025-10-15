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

    const { data: airline, error: airlineError } = await this.supabaseService.client
      .from('airlines')
      .select('id, name')
      .eq('id', airlineId)
      .single();

    if (airlineError || !airline)
      throw new HttpException('Không tìm thấy hãng bay', HttpStatus.NOT_FOUND);


    const { data: flights, error: flightError } = await this.supabaseService.client
      .from('flights')
      .select('id, price')
      .eq('airline_id', airlineId);

    if (flightError)
      throw new HttpException(flightError.message, HttpStatus.BAD_REQUEST);

    const flightIds = flights.map((f) => f.id);

    if (flightIds.length === 0) {
      return {
        airline: airline.name,
        totalFlights: 0,
        totalTickets: 0,
        totalRevenue: 0,
      };
    }


    const { data: tickets, error: ticketError } = await this.supabaseService.client
      .from('tickets')
      .select('id, flight_id, status')
      .in('flight_id', flightIds)
      .eq('status', 'booked');

    if (ticketError)
      throw new HttpException(ticketError.message, HttpStatus.BAD_REQUEST);

    const totalTickets = tickets.length;
    const flightPriceMap = new Map(flights.map((f) => [f.id, f.price]));

    const totalRevenue = tickets.reduce(
      (sum, t) => sum + (flightPriceMap.get(t.flight_id) || 0),
      0,
    );

    return {
      airline: airline.name,
      totalFlights: flightIds.length,
      totalTickets,
      totalRevenue,
    };
  }

}
