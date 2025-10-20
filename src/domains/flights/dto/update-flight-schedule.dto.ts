import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateFlightScheduleDto {
  @IsNotEmpty()
  @IsDateString()
  scheduled_departure_local: string;

  @IsNotEmpty()
  @IsDateString()
  scheduled_arrival_local: string;
}
