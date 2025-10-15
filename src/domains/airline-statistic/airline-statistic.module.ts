import { Module } from '@nestjs/common';
import { AirlineStatisticService } from './airline-statistic.service';
import { AirlineStatisticController } from './airline-statistic.controller';

@Module({
  controllers: [AirlineStatisticController],
  providers: [AirlineStatisticService],
})
export class AirlineStatisticModule {}
