import { Module } from '@nestjs/common';
import { TaxesFeesService } from './taxes_fees.service';
import { TaxesFeesController } from './taxes_fees.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Module({
  controllers: [TaxesFeesController],
  providers: [TaxesFeesService,SupabaseService],
})
export class TaxesFeesModule {}
