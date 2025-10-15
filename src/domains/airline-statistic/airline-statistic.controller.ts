import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AirlineStatisticService } from './airline-statistic.service';
import { CreateAirlineStatisticDto } from './dto/create-airline-statistic.dto';
import { UpdateAirlineStatisticDto } from './dto/update-airline-statistic.dto';

@Controller('airline-statistic')
export class AirlineStatisticController {
  constructor(private readonly airlineStatisticService: AirlineStatisticService) {}

  // @Post()
  // create(@Body() createAirlineStatisticDto: CreateAirlineStatisticDto) {
  //   return this.airlineStatisticService.create(createAirlineStatisticDto);
  // }
  //
  // @Get()
  // findAll() {
  //   return this.airlineStatisticService.findAll();
  // }
  //
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.airlineStatisticService.findOne(+id);
  // }
  //
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAirlineStatisticDto: UpdateAirlineStatisticDto) {
  //   return this.airlineStatisticService.update(+id, updateAirlineStatisticDto);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.airlineStatisticService.remove(+id);
  // }



  @Get(':id/statistics')
  getAirlineById(@Param('id') id: string) {
    return this.airlineStatisticService.getAirlineStatisticsById(id);
  }
}
