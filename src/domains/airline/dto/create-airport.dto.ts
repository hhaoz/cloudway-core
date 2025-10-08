import { IsNotEmpty } from 'class-validator';
export class CreateAirportDto {
  @IsNotEmpty()
  iata_code: string;
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  city: string;
  @IsNotEmpty()
  state: string;
  @IsNotEmpty()
  country: string;
  @IsNotEmpty()
  timezone: string;
  @IsNotEmpty()
  created_at: Date;
}
