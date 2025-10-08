import { IsDateString, IsUUID } from 'class-validator';
export class CreateFlightInstanceDto {
  @IsUUID()
  id: string;

  @IsUUID()
  flight_number_id: string;

  @IsUUID()
  aircraft_id: string;

  @IsDateString()
  scheduled_departure_local: string;

  @IsDateString()
  scheduled_arrival_local: string;

  @IsDateString()
  created_at: string;
}
