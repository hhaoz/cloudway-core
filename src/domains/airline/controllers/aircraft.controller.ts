import { Controller, Get, Post,Patch,Delete ,Param,Body} from '@nestjs/common';
import { AircraftService } from '../services/aircraft.service';
import { CreateAircraftDto } from '../dto/create-aircraft.dto';
import { UpdateAircraftDto } from '../dto/update-aircraft.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('aircraft')
export class AircraftController {
  constructor(private readonly aircraftService: AircraftService) {}

  @Get()
  @Roles(Role.AIRLINE)
  findAll() {
    return this.aircraftService.findAll();
  }

  @Get(':id')
  @Roles(Role.AIRLINE)
  findOne(@Param('id') id: string) {
    return this.aircraftService.findOne(id);
  }

  @Post()
  @Roles(Role.AIRLINE)
  create(@Body() createAirportDto: CreateAircraftDto) {
    return this.aircraftService.create(createAirportDto);
  }

  @Patch(':id')
  @Roles(Role.AIRLINE)
  update(@Param('id') id: string, @Body() updateAircraftDto: UpdateAircraftDto) {
    return this.aircraftService.update(id, updateAircraftDto);
  }

  @Delete(':id')
  @Roles(Role.AIRLINE)
  remove(@Param('id') id: string) {
    return this.aircraftService.remove(id);
  }






}
