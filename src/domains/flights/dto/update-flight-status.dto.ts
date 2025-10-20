import { IsEnum, IsOptional } from 'class-validator';
import { FlightStatus } from '../../../common/enums/flight-status.enum';

export class UpdateFlightStatusDto {
  @IsEnum(FlightStatus, { message: 'Status phải là một trong các giá trị: SCHEDULED, DEPARTED, ARRIVED, CANCELLED' })
  status: FlightStatus;

  @IsOptional()
  actual_departure_local?: string;

  @IsOptional()
  actual_arrival_local?: string;
}
