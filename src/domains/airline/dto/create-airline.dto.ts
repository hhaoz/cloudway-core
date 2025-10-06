import { IsNotEmpty, Max, MaxLength } from 'class-validator';

export class CreateAirlineDto {
  @IsNotEmpty()
  @MaxLength(4,{message: 'Mã hãng không được vượt quá 4 ký tự'})
  iata_code: string;
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  created_at: Date;
}
