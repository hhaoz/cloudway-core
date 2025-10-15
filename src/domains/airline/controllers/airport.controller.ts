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
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
@Controller('airport')
export class AirportController {
  constructor(private readonly airportService: AirportService) { }
  @Get()
  @Roles(Role.AIRLINE, Role.CUSTOMER)
  findAll() {
    return this.airportService.findAll();
  }
  @Get(':id')
  @Roles(Role.AIRLINE)
  findOne(id:string) {
    return this.airportService.findOne(id);
  }
  @Post()
  @Roles(Role.AIRLINE)
  create(@Body() createAirporDto: CreateAirportDto) {
    return this.airportService.create(createAirporDto);
  }
  @Patch(':id')
  @Roles(Role.AIRLINE)
  update(@Param('id') id: string, @Body() updateAirportDto: UpdateAirportDto) {
    return this.airportService.update(id, updateAirportDto);
  }
  @Delete(':id')
  @Roles(Role.AIRLINE)
  remove(id:string) {
    return this.airportService.remove(id);
  }

}
