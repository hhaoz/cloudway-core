import { IsNotEmpty } from 'class-validator';

export class CreateAircraftDto {
  id: string;
  @IsNotEmpty()
  type: string;
  @IsNotEmpty()
  seat_capacity: string;
  @IsNotEmpty()
  created_at: Date;
}
