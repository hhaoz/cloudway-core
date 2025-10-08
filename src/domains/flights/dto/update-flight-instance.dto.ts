import { PartialType } from '@nestjs/mapped-types';
import { CreateFlightInstanceDto } from './create-flight-instance.dto';

export class UpdateFlightInstanceDto extends PartialType(CreateFlightInstanceDto) {}
