import { IsUUID, IsDateString, IsIn, IsInt, Min, IsOptional } from 'class-validator';

export class SearchFlightsDto {
  @IsUUID()
  departure_airport_id: string;

  @IsUUID()
  destination_airport_id: string;

  @IsDateString()
  departure_date: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  return_date?: string; // YYYY-MM-DD (optional, chỉ có nếu roundtrip)

  @IsIn(['oneway', 'roundtrip'])
  trip_type: 'oneway' | 'roundtrip';

  @IsInt()
  @Min(1)
  adults: number;

  @IsInt()
  @Min(0)
  children: number;

  @IsInt()
  @Min(0)
  infants: number;
}

