import { IsEnum } from 'class-validator';
import { FlightStatus } from '../../../common/enums/flight-status.enum';

export class FilterFlightsByStatusDto {
  @IsEnum(FlightStatus, { message: 'Status phải là một trong các giá trị: SCHEDULED, DEPARTED, ARRIVED, CANCELLED' })
  status: FlightStatus;
}
