import { IsNumber, IsString } from 'class-validator';

export class CreateTaxesFeeDto {
  @IsString()
  id:string;
  @IsString()
  code:string;
  @IsString()
  name:string;
  @IsNumber()
  amount:number;
  @IsString()
  type:string;
  @IsString()
  applies_to:string;
  created_at:Date;
}
