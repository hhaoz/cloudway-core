import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AirlineService } from '../services/airline.service';
import { AirportService } from '../services/airport.service';
import { CreateAirportDto } from '../dto/create-airport.dto';
import { UpdateAirportDto } from '../dto/update-airport.dto';
import { UpdateAirlineDto } from '../dto/update-airline.dto';
@Controller('airport')
export class AirportController {
  constructor(private readonly airportService: AirportService) { }
  @Get()
  findAll() {
    return this.airportService.findAll();
  }
  @Get(':id')
  findOne(id:string) {
    return this.airportService.findOne(id);
  }
  @Post()
  create(@Body() createAirporDto: CreateAirportDto) {
    return this.airportService.create(createAirporDto);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAirportDto: UpdateAirportDto) {
    return this.airportService.update(id, updateAirportDto);
  }
  @Delete(':id')
  remove(id:string) {
    return this.airportService.remove(id);
  }

}
