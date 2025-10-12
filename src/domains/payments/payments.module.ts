import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService,SupabaseService],
})
export class PaymentsModule {}
