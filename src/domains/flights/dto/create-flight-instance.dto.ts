// import { IsDateString, IsUUID } from 'class-validator';
// export class CreateFlightInstanceDto {
//   @IsUUID()
//   id: string;

//   @IsUUID()
//   flight_number_id: string;

//   @IsUUID()
//   aircraft_id: string;

//   @IsDateString()
//   scheduled_departure_local: string;

//   @IsDateString()
//   scheduled_arrival_local: string;

//   @IsDateString()
//   created_at: string;
// }


import { IsArray, IsNotEmpty, IsUUID, IsString, IsNumber } from 'class-validator';

export class CreateFlightInstanceDto {
  @IsUUID()
  airline_id: string;

  flight_number: {
    code: string;
    departure_airport_id: string;
    arrival_airport_id: string;
  };

  @IsUUID()
  aircraft_id: string;

  @IsNotEmpty()
  scheduled_departure_local: string;

  @IsNotEmpty()
  scheduled_arrival_local: string;

  @IsArray()
  fares: {
    fare_bucket_id: string;
    base_price: number;
  }[];
}
