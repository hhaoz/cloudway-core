import { Controller, Get, Param } from '@nestjs/common';
import { AirlineStatisticService } from './airline-statistic.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('airline-statistics')
export class AirlineStatisticController {
  constructor(private readonly airlineStatisticService: AirlineStatisticService) {}

  @Get(':airlineId')
  @Roles(Role.ADMIN, Role.AIRLINE)
  getAirlineStatistics(@Param('airlineId') airlineId: string) {
    return this.airlineStatisticService.getAirlineStatistics(airlineId);
  }
}