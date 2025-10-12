import { IsPhoneNumber, IsString } from 'class-validator';

export class CreateBookingDto {
@IsString()
id:string;
@IsString()
pnr_code:string;
@IsString()
user_id:string;
@IsString()
constact_fullname:string;
@IsString()
@IsPhoneNumber()
constact_phone:string;
@IsString()
status:string;
created_at:Date;
updated_at:Date;
}
