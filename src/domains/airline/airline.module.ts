import { Module } from '@nestjs/common';
import { AirlineService } from './services/airline.service';
import { AirlineController } from './controllers/airline.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { AircraftService } from './services/aircraft.service';
import { AirportService } from './services/airport.service';
import { AirportController } from './controllers/airport.controller';
import { AircraftController } from './controllers/aircraft.controller';

@Module({
  controllers: [AirlineController,AirportController,AircraftController],
  providers: [AirlineService,SupabaseService,AircraftService,AirportService],
})
export class AirlineModule {}
