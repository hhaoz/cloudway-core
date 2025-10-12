import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaxesFeesService } from './taxes_fees.service';
import { CreateTaxesFeeDto } from './dto/create-taxes_fee.dto';
import { UpdateTaxesFeeDto } from './dto/update-taxes_fee.dto';

@Controller('taxes-fees')
export class TaxesFeesController {
  constructor(private readonly taxesFeesService: TaxesFeesService) {}

  @Post()
  create(@Body() createTaxesFeeDto: CreateTaxesFeeDto) {
    return this.taxesFeesService.create(createTaxesFeeDto);
  }

  @Get()
  findAll() {
    return this.taxesFeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taxesFeesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaxesFeeDto: UpdateTaxesFeeDto) {
    return this.taxesFeesService.update(id, updateTaxesFeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taxesFeesService.remove(id);
  }
}
