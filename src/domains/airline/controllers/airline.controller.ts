import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AirlineService } from '../services/airline.service';
import { CreateAirlineDto } from '../dto/create-airline.dto';
import { UpdateAirlineDto } from '../dto/update-airline.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('airline')
export class AirlineController {
  constructor(private readonly airlineService: AirlineService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createAirlineDto: CreateAirlineDto) {
    return this.airlineService.create(createAirlineDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.airlineService.findAll();
  }

  @Get(':id')
  @Roles(Role.AIRLINE)
  findOne(@Param('id') id: string) {
    return this.airlineService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.AIRLINE)
  update(@Param('id') id: string, @Body() updateAirlineDto: UpdateAirlineDto) {
    return this.airlineService.update(id, updateAirlineDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.airlineService.remove(id);
  }

}
