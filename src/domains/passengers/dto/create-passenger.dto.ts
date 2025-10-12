import { IsEmail, IsPhoneNumber, IsString, MaxLength } from 'class-validator';
export class CreatePassengerDto {
  @IsString()
  id:string;
  @IsString()
  booking_id:string;
  @IsString()
  full_name:string;
  date_of_birth:Date;
  @IsString()
  id_number:string;
  @IsString()
  @IsPhoneNumber()
  @MaxLength(10)
  phone:string;
  @IsString()
  @IsEmail()
  email:string;
  @IsString()
  passenger_type:string;
  created_at:Date;

}
