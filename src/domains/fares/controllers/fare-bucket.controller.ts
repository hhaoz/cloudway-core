import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import {  } from '../services/fares.service';
import { CreateFareBucketDto } from '../dto/create-fare-bucket.dto';
import { UpdateFareBucketDto } from '../dto/update-fare-bucket.dto';
import { FareBucketService } from '../services/fare-bucket.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('fare-bucket')
export class FareBucketController {
  constructor(private readonly fareBucketService: FareBucketService){}

  @Post()
  create(@Body() createFareBucketDto: CreateFareBucketDto) {
    return this.fareBucketService.create(createFareBucketDto);
  }

  @Get()
  findAll() {
    return this.fareBucketService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fareBucketService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFareBucketDto: UpdateFareBucketDto) {
    return this.fareBucketService.update(id, updateFareBucketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fareBucketService.remove(id);
  }

  @Get('airline-only')
  @Roles(Role.AIRLINE)
  airlineOnly() {
    return { ok: true };
  }
}
