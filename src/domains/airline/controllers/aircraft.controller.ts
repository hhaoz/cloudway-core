import { Controller, Get, Post,Patch,Delete ,Param,Body} from '@nestjs/common';
import { AircraftService } from '../services/aircraft.service';
import { CreateAircraftDto } from '../dto/create-aircraft.dto';
import { UpdateAircraftDto } from '../dto/update-aircraft.dto';

@Controller('aircraft')
export class AircraftController {
  constructor(private readonly aircraftService: AircraftService) {}

  @Get()
  findAll() {
    return this.aircraftService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aircraftService.findOne(id);
  }

  @Post()
  create(@Body() createAirportDto: CreateAircraftDto) {
    return this.aircraftService.create(createAirportDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAircraftDto: UpdateAircraftDto) {
    return this.aircraftService.update(id, updateAircraftDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aircraftService.remove(id);
  }
}
