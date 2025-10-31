import { CreateFlightInstanceDto } from '../dto/create-flight-instance.dto';
import { UpdateFlightInstanceDto } from '../dto/update-flight-instance.dto';
import { UpdateFlightScheduleDto } from '../dto/update-flight-schedule.dto';
import { UpdateFlightStatusDto } from '../dto/update-flight-status.dto';
import { SearchFlightsDto } from '../dto/search-flights.dto';
import { FilterFlightsByStatusDto } from '../dto/filter-flights-by-status.dto';
import { FlightStatus } from '../../../common/enums/flight-status.enum';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { AirlineStatisticService } from '../../airline-statistic/airline-statistic.service';
export declare class FlightsInstanceService {
    private readonly supabaseService;
    private readonly airlineStatisticService;
    constructor(supabaseService: SupabaseService, airlineStatisticService: AirlineStatisticService);
    create(createFlightInstanceDto: CreateFlightInstanceDto): Promise<any[]>;
    findAll(): Promise<{
        available_seats: any;
        total_seats: any;
        id: any;
        status: any;
        scheduled_departure_local: any;
        scheduled_arrival_local: any;
        flight_number: {
            code: any;
            departure_airport: {
                iata_code: any;
                city: any;
            }[];
            arrival_airport: {
                iata_code: any;
                city: any;
            }[];
            airline: {
                id: any;
                name: any;
                iata_code: any;
                logo: any;
            }[];
        }[];
        inventories: {
            available_seats: any;
            total_seats: any;
            fare_bucket_id: any;
        }[];
        aircraft: {
            id: any;
            seat_capacity: any;
        }[];
    }[]>;
    findOne(id: string): Promise<any>;
    findByAirline(airlineId: string): Promise<{
        available_seats: any;
        total_seats: any;
        id: any;
        scheduled_departure_local: any;
        scheduled_arrival_local: any;
        created_at: any;
        status: any;
        flight_number: {
            id: any;
            code: any;
            airline_id: any;
            departure_airport: {
                id: any;
                iata_code: any;
                name: any;
                city: any;
                country: any;
            }[];
            arrival_airport: {
                id: any;
                iata_code: any;
                name: any;
                city: any;
                country: any;
            }[];
            airline: {
                id: any;
                name: any;
                iata_code: any;
                logo: any;
            }[];
        }[];
        aircraft: {
            id: any;
            type: any;
            seat_capacity: any;
        }[];
        inventories: {
            available_seats: any;
            total_seats: any;
            fare_bucket_id: any;
        }[];
    }[]>;
    update(id: string, updateFlightDto: UpdateFlightInstanceDto): Promise<any>;
    updateStatus(id: string, updateStatusDto: UpdateFlightStatusDto): Promise<{
        message: string;
        data: any;
    }>;
    updateSchedule(id: string, updateScheduleDto: UpdateFlightScheduleDto): Promise<{
        message: string;
        data: {
            id: any;
            scheduled_departure_local: any;
            scheduled_arrival_local: any;
            updated_at: any;
            flight_number: {
                code: any;
                departure_airport: {
                    iata_code: any;
                    city: any;
                }[];
                arrival_airport: {
                    iata_code: any;
                    city: any;
                }[];
            }[];
        };
    }>;
    remove(id: string): Promise<any>;
    cancelFlight(id: string): Promise<{
        message: string;
        cancelled_flight: {
            id: any;
            status: any;
            scheduled_departure_local: any;
            scheduled_arrival_local: any;
            updated_at: any;
            flight_number: {
                code: any;
                departure_airport: {
                    iata_code: any;
                    city: any;
                }[];
                arrival_airport: {
                    iata_code: any;
                    city: any;
                }[];
            }[];
        };
    }>;
    createFlight(dto: CreateFlightInstanceDto): Promise<{
        message: string;
        flight_instance_id: any;
    }>;
    searchFlights(searchDto: SearchFlightsDto): Promise<{
        trip_type: "oneway" | "roundtrip";
        passengers: {
            adults: number;
            children: number;
            infants: number;
            total: number;
        };
        outbound: {
            departure_date: string;
            flights: any[];
        };
        return: {
            departure_date: string;
            flights: any[];
        } | null;
    }>;
    private findFlightsByRoute;
    private checkSeatAvailability;
    private calculateFlightPrice;
    filterByStatus(filterDto: FilterFlightsByStatusDto): Promise<{
        status: FlightStatus;
        total_flights: number;
        flights: {
            id: any;
            status: any;
            scheduled_departure_local: any;
            scheduled_arrival_local: any;
            created_at: any;
            updated_at: any;
            flight_number: {
                id: any;
                code: any;
                airline_id: any;
                departure_airport: {
                    id: any;
                    iata_code: any;
                    name: any;
                    city: any;
                    country: any;
                }[];
                arrival_airport: {
                    id: any;
                    iata_code: any;
                    name: any;
                    city: any;
                    country: any;
                }[];
                airline: {
                    id: any;
                    name: any;
                    iata_code: any;
                    logo: any;
                }[];
            }[];
            aircraft: {
                id: any;
                type: any;
                seat_capacity: any;
            }[];
        }[];
    }>;
    private updateAirlineStatisticsOnStatusChange;
}
