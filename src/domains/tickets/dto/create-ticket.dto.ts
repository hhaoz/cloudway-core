import { IsString } from 'class-validator';

export class CreateTicketDto {
id:string;
@IsString()
passenger_id:string;
@IsString()
booking_segment_id:string;
@IsString()
ticket_number:string;
created_at:Date;
}
