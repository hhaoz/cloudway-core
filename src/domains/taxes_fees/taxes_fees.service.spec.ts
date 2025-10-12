import { Test, TestingModule } from '@nestjs/testing';
import { TaxesFeesService } from './taxes_fees.service';

describe('TaxesFeesService', () => {
  let service: TaxesFeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxesFeesService],
    }).compile();

    service = module.get<TaxesFeesService>(TaxesFeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
