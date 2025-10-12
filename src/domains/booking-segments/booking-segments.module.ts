import { Module } from '@nestjs/common';
import { BookingSegmentsService } from './booking-segments.service';
import { BookingSegmentsController } from './booking-segments.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Module({
  controllers: [BookingSegmentsController],
  providers: [BookingSegmentsService,SupabaseService],
})
export class BookingSegmentsModule {}
