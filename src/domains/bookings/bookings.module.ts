import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { AirlineStatisticService } from '../airline-statistic/airline-statistic.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, SupabaseService, AirlineStatisticService],
})
export class BookingsModule {}
