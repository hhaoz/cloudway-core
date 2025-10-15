import { PartialType } from '@nestjs/mapped-types';
import { CreateAirlineStatisticDto } from './create-airline-statistic.dto';

export class UpdateAirlineStatisticDto extends PartialType(CreateAirlineStatisticDto) {}
