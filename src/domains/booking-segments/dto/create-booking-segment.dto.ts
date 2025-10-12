import { IsNotEmpty, IsString } from 'class-validator';
export class CreateBookingSegmentDto {
  id:string;
  @IsNotEmpty()
  @IsString()
  booking_id:string;
  @IsNotEmpty()
  @IsString()
  flight_instance_id:string;
  @IsNotEmpty()
  @IsString()
  fare_bucket_id:string;
  created_at:Date;
  updated_at:Date;
}
