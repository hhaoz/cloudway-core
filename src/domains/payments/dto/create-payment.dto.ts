import { IsUUID, IsNumber, IsString, IsOptional, IsDate } from 'class-validator';
export class CreatePaymentDto {
  @IsUUID()
  id: string;

  @IsUUID()
  booking_id: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  payment_method: string;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  transaction_id?: string;

  @IsDate()
  @IsOptional()
  paid_at: Date;

  @IsDate()
  @IsOptional()
  created_at: Date;
}
