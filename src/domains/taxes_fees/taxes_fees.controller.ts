import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaxesFeesService } from './taxes_fees.service';
import { CreateTaxesFeeDto } from './dto/create-taxes_fee.dto';
import { UpdateTaxesFeeDto } from './dto/update-taxes_fee.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('taxes-fees')
export class TaxesFeesController {
  constructor(private readonly taxesFeesService: TaxesFeesService) {}

  @Post()
  @Roles(Role.AIRLINE)
  create(@Body() createTaxesFeeDto: CreateTaxesFeeDto) {
    return this.taxesFeesService.create(createTaxesFeeDto);
  }

  @Get()
  @Roles(Role.AIRLINE)
  findAll() {
    return this.taxesFeesService.findAll();
  }

  @Get(':id')
  @Roles(Role.AIRLINE)
  findOne(@Param('id') id: string) {
    return this.taxesFeesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.AIRLINE)
  update(@Param('id') id: string, @Body() updateTaxesFeeDto: UpdateTaxesFeeDto) {
    return this.taxesFeesService.update(id, updateTaxesFeeDto);
  }

  @Delete(':id')
  @Roles(Role.AIRLINE)
  remove(@Param('id') id: string) {
    return this.taxesFeesService.remove(id);
  }
}
