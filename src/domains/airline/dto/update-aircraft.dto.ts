import { CreateAircraftDto } from './create-aircraft.dto';
import { PartialType } from '@nestjs/mapped-types';
export class UpdateAircraftDto extends PartialType(CreateAircraftDto) {}
