import { IsNumber, IsString } from 'class-validator';
export class CreateInventoryDto {
  id:string;
  @IsString()
  flight_instance_id:string;
  @IsString()
  fare_bucket_id:string;
  @IsNumber()
  available_seats:number;
  @IsNumber()
  total_seats:number;
  created_at:Date;
  updated_at:Date;
}
