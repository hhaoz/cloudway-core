import { Module } from '@nestjs/common';
import { FlightsInstanceService } from './services/./flights-instance.service';
import { FlightsInstanceController } from './controllers/flights-instance .controller';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { FlightNumberService } from './services/flight-number.service';
import { FlightNumberController } from './controllers/flight-number.controller';
import { AirlineStatisticService } from '../airline-statistic/airline-statistic.service';

@Module({
  controllers: [FlightsInstanceController, FlightNumberController],
  providers: [SupabaseService, FlightsInstanceService, FlightNumberService, AirlineStatisticService],
})
export class FlightsModule {}
