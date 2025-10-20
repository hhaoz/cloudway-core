import { Module } from '@nestjs/common';
import { AirlineStatisticService } from './airline-statistic.service';
import { AirlineStatisticController } from './airline-statistic.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Module({
  controllers: [AirlineStatisticController],
  providers: [AirlineStatisticService, SupabaseService],
  exports: [AirlineStatisticService],
})
export class AirlineStatisticModule {}