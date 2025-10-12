import { Test, TestingModule } from '@nestjs/testing';
import { TaxesFeesController } from './taxes_fees.controller';
import { TaxesFeesService } from './taxes_fees.service';

describe('TaxesFeesController', () => {
  let controller: TaxesFeesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxesFeesController],
      providers: [TaxesFeesService],
    }).compile();

    controller = module.get<TaxesFeesController>(TaxesFeesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
