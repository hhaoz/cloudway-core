import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FaresService } from './fares.service';
import { CreateFareDto } from './dto/create-fare.dto';
import { UpdateFareDto } from './dto/update-fare.dto';

@Controller('fares')
export class FaresController {
  constructor(private readonly faresService: FaresService) {}

  @Post()
  create(@Body() createFareDto: CreateFareDto) {
    return this.faresService.create(createFareDto);
  }

  @Get()
  findAll() {
    return this.faresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.faresService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFareDto: UpdateFareDto) {
    return this.faresService.update(+id, updateFareDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.faresService.remove(+id);
  }
}
