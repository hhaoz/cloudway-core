"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightsInstanceService = void 0;
const common_1 = require("@nestjs/common");
const flight_status_enum_1 = require("../../../common/enums/flight-status.enum");
const supabase_service_1 = require("../../../services/supabase/supabase.service");
const airline_statistic_service_1 = require("../../airline-statistic/airline-statistic.service");
let FlightsInstanceService = class FlightsInstanceService {
    supabaseService;
    airlineStatisticService;
    constructor(supabaseService, airlineStatisticService) {
        this.supabaseService = supabaseService;
        this.airlineStatisticService = airlineStatisticService;
    }
    async create(createFlightInstanceDto) {
        const { data, error } = await this.supabaseService.client
            .from("flight_instances")
            .insert(createFlightInstanceDto)
            .select();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
    async findAll() {
        const { data, error } = await this.supabaseService.client
            .from("flight_instances")
            .select(`
        id,
        status,
        scheduled_departure_local,
        scheduled_arrival_local,
        flight_number:flight_number_id (
          code,
          departure_airport:departure_airport_id (iata_code, city),
          arrival_airport:arrival_airport_id (iata_code, city),
          airline:airline_id (
            id,
            name,
            iata_code,
            logo
          )
        ),
        inventories:inventories (
          available_seats,
          total_seats,
          fare_bucket_id
        ),
        aircraft:aircraft_id (
          id,
          seat_capacity
        )
      `)
            .neq('status', flight_status_enum_1.FlightStatus.CANCELLED)
            .order('scheduled_departure_local', { ascending: false });
        if (error) {
            throw new Error(error.message);
        }
        const dataWithSeats = (data || []).map(flight => {
            const inventories = flight.inventories || [];
            const totalAvailableSeats = inventories.reduce((sum, inv) => sum + (inv.available_seats || 0), 0);
            const totalSeats = inventories.reduce((sum, inv) => sum + (inv.total_seats || 0), 0);
            let actualAvailableSeats = totalAvailableSeats;
            let actualTotalSeats = totalSeats;
            if (inventories.length === 0) {
                const aircraft = flight.aircraft;
                if (aircraft?.seat_capacity) {
                    actualTotalSeats = aircraft.seat_capacity;
                    actualAvailableSeats = aircraft.seat_capacity;
                }
            }
            return {
                ...flight,
                available_seats: actualAvailableSeats,
                total_seats: actualTotalSeats
            };
        });
        return dataWithSeats;
    }
    async findOne(id) {
        const { data, error } = await this.supabaseService.client
            .from("flight_instances")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
    async findByAirline(airlineId) {
        const { data, error } = await this.supabaseService.client
            .from('flight_instances')
            .select(`
        id,
        scheduled_departure_local,
        scheduled_arrival_local,
        created_at,
        status,
        flight_number:flight_number_id!inner (
          id,
          code,
          airline_id,
          departure_airport:departure_airport_id (
            id,
            iata_code,
            name,
            city,
            country
          ),
          arrival_airport:arrival_airport_id (
            id,
            iata_code,
            name,
            city,
            country
          ),
          airline:airline_id (
            id,
            name,
            iata_code,
            logo
          )
        ),
        aircraft:aircraft_id (
          id,
          type,
          seat_capacity
        ),
        inventories:inventories (
          available_seats,
          total_seats,
          fare_bucket_id
        )
      `)
            .eq('flight_number.airline_id', airlineId)
            .order('scheduled_departure_local', { ascending: false });
        if (error) {
            throw new Error(error.message);
        }
        const dataWithSeats = (data || []).map(flight => {
            const inventories = flight.inventories || [];
            const totalAvailableSeats = inventories.reduce((sum, inv) => sum + (inv.available_seats || 0), 0);
            const totalSeats = inventories.reduce((sum, inv) => sum + (inv.total_seats || 0), 0);
            let actualAvailableSeats = totalAvailableSeats;
            let actualTotalSeats = totalSeats;
            if (inventories.length === 0) {
                const aircraft = flight.aircraft;
                if (aircraft?.seat_capacity) {
                    actualTotalSeats = aircraft.seat_capacity;
                    actualAvailableSeats = aircraft.seat_capacity;
                }
            }
            return {
                ...flight,
                available_seats: actualAvailableSeats,
                total_seats: actualTotalSeats
            };
        });
        return dataWithSeats;
    }
    async update(id, updateFlightDto) {
        const { data, error } = await this.supabaseService.client
            .from("flight_instances")
            .update(updateFlightDto)
            .eq("id", id)
            .select()
            .single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
    async updateStatus(id, updateStatusDto) {
        const { data, error } = await this.supabaseService.client
            .from("flight_instances")
            .update({
            status: updateStatusDto.status,
            actual_departure_local: updateStatusDto.actual_departure_local,
            actual_arrival_local: updateStatusDto.actual_arrival_local,
            updated_at: new Date().toISOString()
        })
            .eq("id", id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Lỗi khi cập nhật status: ${error.message}`);
        }
        await this.updateAirlineStatisticsOnStatusChange(id, updateStatusDto.status);
        return {
            message: 'Cập nhật status chuyến bay thành công',
            data
        };
    }
    async updateSchedule(id, updateScheduleDto) {
        const { scheduled_departure_local, scheduled_arrival_local } = updateScheduleDto;
        const { data: existingFlight, error: checkError } = await this.supabaseService.client
            .from('flight_instances')
            .select('id')
            .eq('id', id)
            .single();
        if (checkError || !existingFlight) {
            throw new common_1.NotFoundException(`Không tìm thấy chuyến bay với ID: ${id}`);
        }
        const departureTime = new Date(scheduled_departure_local);
        const arrivalTime = new Date(scheduled_arrival_local);
        if (arrivalTime <= departureTime) {
            throw new common_1.BadRequestException('Giờ đến phải sau giờ đi');
        }
        const { data, error } = await this.supabaseService.client
            .from('flight_instances')
            .update({
            scheduled_departure_local,
            scheduled_arrival_local,
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .select(`
        id,
        scheduled_departure_local,
        scheduled_arrival_local,
        updated_at,
        flight_number:flight_number_id (
          code,
          departure_airport:departure_airport_id (iata_code, city),
          arrival_airport:arrival_airport_id (iata_code, city)
        )
      `)
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Lỗi khi cập nhật lịch trình: ${error.message}`);
        }
        return {
            message: 'Cập nhật lịch trình chuyến bay thành công',
            data
        };
    }
    async remove(id) {
        const { data, error } = await this.supabaseService.client
            .from("flight_instances")
            .delete()
            .eq("id", id)
            .select()
            .single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
    async cancelFlight(id) {
        const { data: existingFlight, error: checkError } = await this.supabaseService.client
            .from('flight_instances')
            .select(`
        id,
        status,
        scheduled_departure_local,
        scheduled_arrival_local,
        flight_number:flight_number_id (
          code,
          airline_id,
          departure_airport:departure_airport_id (iata_code, city),
          arrival_airport:arrival_airport_id (iata_code, city)
        )
      `)
            .eq('id', id)
            .single();
        if (checkError || !existingFlight) {
            throw new common_1.NotFoundException(`Không tìm thấy chuyến bay với ID: ${id}`);
        }
        if (existingFlight.status === flight_status_enum_1.FlightStatus.CANCELLED) {
            throw new common_1.BadRequestException('Chuyến bay đã được hủy trước đó');
        }
        const { data: existingBookings, error: bookingError } = await this.supabaseService.client
            .from('booking_segments')
            .select('id, booking_id')
            .eq('flight_instance_id', id);
        if (bookingError) {
            throw new common_1.BadRequestException(`Lỗi khi kiểm tra đặt vé: ${bookingError.message}`);
        }
        if (existingBookings && existingBookings.length > 0) {
            throw new common_1.BadRequestException(`Không thể hủy chuyến bay vì đã có ${existingBookings.length} booking(s) được đặt cho chuyến bay này. Chỉ có thể hủy chuyến bay khi chưa có ai đặt vé.`);
        }
        const { data, error } = await this.supabaseService.client
            .from('flight_instances')
            .update({
            status: flight_status_enum_1.FlightStatus.CANCELLED,
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .select(`
        id,
        status,
        scheduled_departure_local,
        scheduled_arrival_local,
        updated_at,
        flight_number:flight_number_id (
          code,
          departure_airport:departure_airport_id (iata_code, city),
          arrival_airport:arrival_airport_id (iata_code, city)
        )
      `)
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Lỗi khi hủy chuyến bay: ${error.message}`);
        }
        try {
            const airlineId = existingFlight.flight_number?.airline_id;
            if (airlineId) {
                await this.airlineStatisticService.updateStatisticsOnFlightCancellation(airlineId);
            }
        }
        catch (statsError) {
            console.error('Lỗi cập nhật thống kê airline khi hủy chuyến bay:', statsError);
        }
        return {
            message: 'Hủy chuyến bay thành công',
            cancelled_flight: data
        };
    }
    async createFlight(dto) {
        const { airline_id, flight_number, aircraft_id, scheduled_departure_local, scheduled_arrival_local, fares } = dto;
        const { data: existingFlightNumber } = await this.supabaseService.client
            .from('flight_numbers')
            .select('id')
            .eq('code', flight_number.code)
            .maybeSingle();
        let flightNumberId = existingFlightNumber?.id;
        if (!flightNumberId) {
            const { data: newFlightNumber, error: fnError } = await this.supabaseService.client
                .from('flight_numbers')
                .insert([
                {
                    code: flight_number.code,
                    departure_airport_id: flight_number.departure_airport_id,
                    arrival_airport_id: flight_number.arrival_airport_id,
                    airline_id
                }
            ])
                .select()
                .single();
            if (fnError)
                throw new common_1.BadRequestException(fnError.message);
            flightNumberId = newFlightNumber.id;
        }
        const { data: newInstance, error: fiError } = await this.supabaseService.client
            .from('flight_instances')
            .insert([
            {
                flight_number_id: flightNumberId,
                aircraft_id,
                scheduled_departure_local,
                scheduled_arrival_local
            }
        ])
            .select()
            .single();
        if (fiError)
            throw new common_1.BadRequestException(fiError.message);
        const flightInstanceId = newInstance.id;
        const { data: aircraft } = await this.supabaseService.client
            .from('aircrafts')
            .select('seat_capacity')
            .eq('id', aircraft_id)
            .single();
        if (!aircraft) {
            throw new common_1.BadRequestException('Không tìm thấy thông tin máy bay');
        }
        const aircraftCapacity = aircraft.seat_capacity;
        const totalSeatsFromInput = fares.reduce((sum, fare) => sum + (fare.total_seats || 0), 0);
        if (totalSeatsFromInput > aircraftCapacity) {
            throw new common_1.BadRequestException(`Tổng số ghế (${totalSeatsFromInput}) vượt quá sức chứa của máy bay (${aircraftCapacity})`);
        }
        for (const fare of fares) {
            if (!fare.total_seats || fare.total_seats <= 0) {
                throw new common_1.BadRequestException(`Số ghế cho fare_bucket_id ${fare.fare_bucket_id} phải lớn hơn 0`);
            }
        }
        const fareRows = fares.map((f) => ({
            flight_instance_id: flightInstanceId,
            fare_bucket_id: f.fare_bucket_id,
            base_price: f.base_price
        }));
        const inventoryRows = fares.map((f) => ({
            flight_instance_id: flightInstanceId,
            fare_bucket_id: f.fare_bucket_id,
            available_seats: f.total_seats,
            total_seats: f.total_seats
        }));
        const { error: fareError } = await this.supabaseService.client.from('fares').insert(fareRows);
        if (fareError)
            throw new common_1.BadRequestException(fareError.message);
        const { error: invError } = await this.supabaseService.client
            .from('inventories')
            .insert(inventoryRows);
        if (invError)
            throw new common_1.BadRequestException(invError.message);
        try {
            await this.airlineStatisticService.updateStatisticsOnFlight(airline_id, true);
        }
        catch (statsError) {
            console.error('Lỗi cập nhật thống kê airline:', statsError);
        }
        return {
            message: 'Flight created successfully',
            flight_instance_id: flightInstanceId
        };
    }
    async searchFlights(searchDto) {
        const { departure_airport_id, destination_airport_id, departure_date, return_date, trip_type, adults, children, infants } = searchDto;
        const totalPassengers = adults + children + infants;
        const outboundFlights = await this.findFlightsByRoute(departure_airport_id, destination_airport_id, departure_date, totalPassengers);
        let returnFlights = [];
        if (trip_type === 'roundtrip' && return_date) {
            returnFlights = await this.findFlightsByRoute(destination_airport_id, departure_airport_id, return_date, totalPassengers);
        }
        const outboundWithPrices = await Promise.all(outboundFlights.map(flight => this.calculateFlightPrice(flight, adults, children, infants)));
        const returnWithPrices = trip_type === 'roundtrip' && return_date
            ? await Promise.all(returnFlights.map(flight => this.calculateFlightPrice(flight, adults, children, infants)))
            : [];
        return {
            trip_type,
            passengers: {
                adults,
                children,
                infants,
                total: totalPassengers
            },
            outbound: {
                departure_date,
                flights: outboundWithPrices
            },
            return: trip_type === 'roundtrip' && return_date ? {
                departure_date: return_date,
                flights: returnWithPrices
            } : null
        };
    }
    async findFlightsByRoute(departureAirportId, arrivalAirportId, date, minSeats) {
        const startDate = new Date(date);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        const startOfDay = startDate.toISOString().split('T')[0];
        const nextDay = nextDate.toISOString().split('T')[0];
        const { data: flights, error } = await this.supabaseService.client
            .from('flight_instances')
            .select(`
        id,
        scheduled_departure_local,
        scheduled_arrival_local,
        flight_number:flight_number_id!inner (
          code,
          departure_airport:departure_airport_id (
            id,
            iata_code,
            name,
            city,
            country
          ),
          arrival_airport:arrival_airport_id (
            id,
            iata_code,
            name,
            city,
            country
          ),
          airline:airline_id (
            id,
            name,
            iata_code,
            logo
          )
        ),
        aircraft:aircraft_id (
          id,
          type,
          seat_capacity
        )
      `)
            .eq('flight_number.departure_airport_id', departureAirportId)
            .eq('flight_number.arrival_airport_id', arrivalAirportId)
            .neq('status', flight_status_enum_1.FlightStatus.CANCELLED)
            .gte('scheduled_departure_local', startOfDay)
            .lt('scheduled_departure_local', nextDay)
            .order('scheduled_departure_local', { ascending: true });
        if (error) {
            console.error('Error finding flights:', error);
            return [];
        }
        const flightsWithAvailability = await Promise.all((flights || []).map(async (flight) => {
            const availability = await this.checkSeatAvailability(flight.id, minSeats);
            const { data: fares, error: faresError } = await this.supabaseService.client
                .from('fares')
                .select(`
                base_price,
                fare_bucket:fare_bucket_id (
                  id,
                  code,
                  class_type,
                  description
                )
              `)
                .eq('flight_instance_id', flight.id);
            return {
                ...flight,
                has_available_seats: availability.hasEnoughSeats,
                available_seats: availability.totalAvailable,
                total_seats: availability.totalSeats,
                fare_buckets: availability.fareBuckets,
                fares: fares || []
            };
        }));
        return flightsWithAvailability.filter(f => f.has_available_seats);
    }
    async checkSeatAvailability(flightInstanceId, requiredSeats) {
        const { data: inventories } = await this.supabaseService.client
            .from('inventories')
            .select(`
        fare_bucket_id,
        available_seats,
        total_seats,
        fare_bucket:fare_bucket_id (
          code,
          class,
          description
        )
      `)
            .eq('flight_instance_id', flightInstanceId);
        const totalAvailable = (inventories || []).reduce((sum, inv) => sum + inv.available_seats, 0);
        const totalSeats = (inventories || []).reduce((sum, inv) => sum + inv.total_seats, 0);
        const hasInventory = inventories && inventories.length > 0;
        let actualAvailableSeats = totalAvailable;
        let actualTotalSeats = totalSeats;
        if (!hasInventory) {
            const { data: flightInstance } = await this.supabaseService.client
                .from('flight_instances')
                .select(`
          aircraft:aircraft_id (
            seat_capacity
          )
        `)
                .eq('id', flightInstanceId)
                .single();
            actualTotalSeats = flightInstance?.aircraft?.seat_capacity || 0;
            actualAvailableSeats = actualTotalSeats;
        }
        const hasEnoughSeats = actualAvailableSeats >= requiredSeats;
        return {
            hasEnoughSeats,
            totalAvailable: actualAvailableSeats,
            totalSeats: actualTotalSeats,
            fareBuckets: inventories || []
        };
    }
    async calculateFlightPrice(flight, adults, children, infants) {
        const fares = flight.fares || [];
        if (!fares || fares.length === 0) {
            return {
                ...flight,
                fares: [],
                pricing: {
                    base_price: 0,
                    total_passengers: adults + children + infants,
                    total_price: 0,
                    currency: 'VND',
                    breakdown: {
                        adults: adults > 0 ? { count: adults, unit_price: 0, total: 0 } : null,
                        children: children > 0 ? { count: children, unit_price: 0, total: 0 } : null,
                        infants: infants > 0 ? { count: infants, unit_price: 0, total: 0 } : null
                    }
                }
            };
        }
        const economyFare = fares.find(f => f.fare_bucket?.class_type?.toLowerCase().includes('economy') ||
            f.fare_bucket?.code?.toLowerCase().includes('eco') ||
            f.fare_bucket?.description?.toLowerCase().includes('economy'));
        const defaultPrice = economyFare ? economyFare.base_price : Math.min(...fares.map(f => f.base_price));
        const totalPassengers = adults + children + infants;
        const totalPrice = defaultPrice * totalPassengers;
        const departure = new Date(flight.scheduled_departure_local);
        const arrival = new Date(flight.scheduled_arrival_local);
        const durationMinutes = Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60));
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return {
            flight_id: flight.id,
            flight_number: flight.flight_number?.code,
            airline: {
                id: flight.flight_number?.airline?.id,
                name: flight.flight_number?.airline?.name,
                code: flight.flight_number?.airline?.iata_code,
                logo: flight.flight_number?.airline?.logo
            },
            departure: {
                airport: flight.flight_number?.departure_airport,
                time: flight.scheduled_departure_local
            },
            arrival: {
                airport: flight.flight_number?.arrival_airport,
                time: flight.scheduled_arrival_local
            },
            duration: {
                hours,
                minutes,
                total_minutes: durationMinutes,
                formatted: `${hours}h ${minutes}m`
            },
            aircraft: flight.aircraft,
            status: flight.status || 'SCHEDULED',
            available_seats: flight.available_seats,
            total_seats: flight.total_seats,
            fares: fares,
            pricing: {
                base_price: defaultPrice,
                total_passengers: totalPassengers,
                total_price: totalPrice,
                currency: 'VND',
                breakdown: {
                    adults: adults > 0 ? { count: adults, unit_price: defaultPrice, total: defaultPrice * adults } : null,
                    children: children > 0 ? { count: children, unit_price: defaultPrice, total: defaultPrice * children } : null,
                    infants: infants > 0 ? { count: infants, unit_price: defaultPrice, total: defaultPrice * infants } : null
                }
            },
            fare_buckets: flight.fare_buckets || []
        };
    }
    async filterByStatus(filterDto) {
        const { status } = filterDto;
        const { data, error } = await this.supabaseService.client
            .from('flight_instances')
            .select(`
        id,
        status,
        scheduled_departure_local,
        scheduled_arrival_local,
        created_at,
        updated_at,
        flight_number:flight_number_id (
          id,
          code,
          airline_id,
          departure_airport:departure_airport_id (
            id,
            iata_code,
            name,
            city,
            country
          ),
          arrival_airport:arrival_airport_id (
            id,
            iata_code,
            name,
            city,
            country
          ),
          airline:airline_id (
            id,
            name,
            iata_code,
            logo
          )
        ),
        aircraft:aircraft_id (
          id,
          type,
          seat_capacity
        )
      `)
            .eq('status', status)
            .order('scheduled_departure_local', { ascending: false });
        if (error) {
            throw new common_1.BadRequestException(`Lỗi khi lọc chuyến bay: ${error.message}`);
        }
        return {
            status,
            total_flights: data?.length || 0,
            flights: data || []
        };
    }
    async updateAirlineStatisticsOnStatusChange(flightInstanceId, newStatus) {
        try {
            const { data: flight } = await this.supabaseService.client
                .from('flight_instances')
                .select(`
          flight_number:flight_number_id (
            airline_id
          )
        `)
                .eq('id', flightInstanceId)
                .single();
            const flightNumber = flight?.flight_number;
            if (!flightNumber?.airline_id) {
                console.warn(`Không tìm thấy airline_id cho flight_instance: ${flightInstanceId}`);
                return;
            }
            const airlineId = flightNumber.airline_id;
            switch (newStatus) {
                case flight_status_enum_1.FlightStatus.DEPARTED:
                case flight_status_enum_1.FlightStatus.ARRIVED:
                    await this.airlineStatisticService.updateStatisticsOnFlight(airlineId, true);
                    break;
                case flight_status_enum_1.FlightStatus.CANCELLED:
                    await this.airlineStatisticService.updateStatisticsOnFlightCancellation(airlineId);
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            console.error('Lỗi cập nhật thống kê airline khi thay đổi status:', error);
        }
    }
};
exports.FlightsInstanceService = FlightsInstanceService;
exports.FlightsInstanceService = FlightsInstanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        airline_statistic_service_1.AirlineStatisticService])
], FlightsInstanceService);
//# sourceMappingURL=flights-instance.service.js.map