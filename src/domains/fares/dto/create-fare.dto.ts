import { IsString, IsUUID, IsOptional, IsDate } from 'class-validator';

export class CreateFareDto {
  id: string;
  @IsOptional()
  @IsUUID()
  flight_instance_id: string;
  @IsUUID()
  fare_bucket_id: string;
  @IsString()
  passenger_type: string;
  base_price: number;
  @IsString()
  baggage_allowance: string;
  change_conditions: string;
  @IsString()
  cancellation_conditions: string;
  @IsDate()
  created_at: Date;

}
