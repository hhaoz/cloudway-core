import {  Body,  Controller,  Delete,  Get,  Param,  Patch,  Post,} from '@nestjs/common';
import { FlightNumberService } from '../services/flight-number.service';
import { CreateFlightNumberDto } from '../dto/create-flight-number.dto';
import { UpdateFlightNumberDto } from '../dto/update-flight-number.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('flight-number')
export class FlightNumberController {
  constructor(private readonly flightNumberService: FlightNumberService) {}
  @Post()
  @Roles(Role.AIRLINE)
  create(@Body() createFlightDto: CreateFlightNumberDto) {
    return this.flightNumberService.create(createFlightDto);
  }

  @Get()
  @Roles(Role.AIRLINE, Role.CUSTOMER)
  findAll() {
    return this.flightNumberService.findAll();
  }

  @Get(':id')
  @Roles(Role.AIRLINE, Role.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.flightNumberService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.AIRLINE)
  update(@Param('id') id: string, @Body() updateFlightNumberDto: UpdateFlightNumberDto) {
    return this.flightNumberService.update(id, updateFlightNumberDto);
  }

  @Delete(':id')
  @Roles(Role.AIRLINE)
  remove(@Param('id') id: string) {
    return this.flightNumberService.remove(id);
  }

}
