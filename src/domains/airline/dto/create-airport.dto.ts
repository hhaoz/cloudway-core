import { IsNotEmpty } from 'class-validator';
export class CreateAirportDto {
  @IsNotEmpty()
  iata_code: string;
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  city: string;
  @IsNotEmpty()
  country: string;
  @IsNotEmpty()
  timezone: string;
}
