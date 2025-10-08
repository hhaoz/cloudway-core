import {  Body,  Controller,  Delete,  Get,  Param,  Patch,  Post,} from '@nestjs/common';
import { FlightNumberService } from '../services/flight-number.service';
import { CreateFlightNumberDto } from '../dto/create-flight-number.dto';
import { UpdateFlightNumberDto } from '../dto/update-flight-number.dto';

@Controller('flight-number')
export class FlightNumberController {
  constructor(private readonly flightNumberService: FlightNumberService) {}
  @Post()
  create(@Body() createFlightDto: CreateFlightNumberDto) {
    return this.flightNumberService.create(createFlightDto);
  }

  @Get()
  findAll() {
    return this.flightNumberService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flightNumberService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFlightNumberDto: UpdateFlightNumberDto) {
    return this.flightNumberService.update(id, updateFlightNumberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flightNumberService.remove(id);
  }
}
