import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxesFeeDto } from './create-taxes_fee.dto';

export class UpdateTaxesFeeDto extends PartialType(CreateTaxesFeeDto) {}
