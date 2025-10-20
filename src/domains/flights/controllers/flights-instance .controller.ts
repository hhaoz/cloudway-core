import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FlightsInstanceService } from '../services/./flights-instance.service';
import { CreateFlightInstanceDto } from '../dto/create-flight-instance.dto';
import { UpdateFlightInstanceDto } from '../dto/update-flight-instance.dto';
import { UpdateFlightScheduleDto } from '../dto/update-flight-schedule.dto';
import { UpdateFlightStatusDto } from '../dto/update-flight-status.dto';
import { SearchFlightsDto } from '../dto/search-flights.dto';
import { FilterFlightsByStatusDto } from '../dto/filter-flights-by-status.dto';
import { Role } from '../../../common/enums/role.enum';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('flights')
export class FlightsInstanceController {
  constructor(
    private readonly flightsInstanceService: FlightsInstanceService
  ) {}

  // @Post()
  // create(@Body() createFlightInstanceDto: CreateFlightInstanceDto) {
  //   return this.flightsInstanceService.create(createFlightInstanceDto);
  // }

  @Post('search')
  async searchFlights(@Body() searchDto: SearchFlightsDto) {
    return this.flightsInstanceService.searchFlights(searchDto);
  }

  @Post()
  async createFlight(@Body() dto: CreateFlightInstanceDto) {
    return this.flightsInstanceService.createFlight(dto);
  }

  @Get()
  findAll() {
    return this.flightsInstanceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flightsInstanceService.findOne(id);
  }

  @Get('airline/:airlineId')
  findByAirline(@Param('airlineId') airlineId: string) {
    return this.flightsInstanceService.findByAirline(airlineId);
  }

  @Get('filter/status')
  filterByStatus(@Query() filterDto: FilterFlightsByStatusDto) {
    return this.flightsInstanceService.filterByStatus(filterDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFlightInstanceDto: UpdateFlightInstanceDto) {
    return this.flightsInstanceService.update(id, updateFlightInstanceDto);
  }

  @Patch(':id/schedule')
  updateSchedule(@Param('id') id: string, @Body() updateScheduleDto: UpdateFlightScheduleDto) {
    return this.flightsInstanceService.updateSchedule(id, updateScheduleDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateFlightStatusDto) {
    return this.flightsInstanceService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flightsInstanceService.remove(id);
  }

  @Patch(':id/cancel')
  cancelFlight(@Param('id') id: string) {
    return this.flightsInstanceService.cancelFlight(id);
  }

  @Get('airline-only')
  @Roles(Role.AIRLINE)
  airlineOnly() {
    return { ok: true };
  }
}
