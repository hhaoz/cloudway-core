import { IsString, IsArray, IsOptional, IsIn, IsDateString, IsEmail, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class PassengerInfoDto {
  @IsString()
  full_name: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsOptional()
  @IsString()
  id_number?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsIn(['ADULT', 'CHILD', 'INFANT'])
  passenger_type: 'ADULT' | 'CHILD' | 'INFANT';
}

export class BookingSegmentDto {
  @IsUUID()
  flight_instance_id: string;

  @IsUUID()
  fare_bucket_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerInfoDto)
  passengers: PassengerInfoDto[];
}

export class CreateBookingWithPassengersDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsString()
  contact_fullname: string;

  @IsString()
  contact_phone: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingSegmentDto)
  segments: BookingSegmentDto[];
}

