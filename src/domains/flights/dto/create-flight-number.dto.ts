import { IsString, IsUUID, IsOptional } from 'class-validator';
export class CreateFlightNumberDto {
  @IsOptional()
  @IsUUID()
  id: string; // Nếu muốn cho phép tự tạo id
  @IsString()
  code: string;
  @IsUUID()
  departure_airport_id: string;
  @IsUUID()
  arrival_airport_id: string;
  created_at: Date;
  @IsUUID()
  airline_id: String;
}
