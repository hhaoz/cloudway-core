import { Module } from '@nestjs/common';
import { FaresService } from './services/fares.service';
import { FaresController } from './controllers/fares.controller';
import { FareBucketService } from './services/fare-bucket.service';
import { FareBucketController } from './controllers/fare-bucket.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Module({
  controllers: [FaresController,FareBucketController],
  providers: [FaresService,FareBucketService,SupabaseService],
})
export class FaresModule {}
