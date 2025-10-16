import { IsNotEmpty, Max, MaxLength } from 'class-validator';

export class CreateAirlineDto {
  @IsNotEmpty()
  @MaxLength(3,{message: 'Mã hãng không được vượt quá 3 ký tự'})
  iata_code: string;
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  logo: string;
}
