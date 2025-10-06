import { Module } from '@nestjs/common';
import { AirlineService } from './airline.service';
import { AirlineController } from './airline.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Module({
  controllers: [AirlineController],
  providers: [AirlineService,SupabaseService],
})
export class AirlineModule {}
