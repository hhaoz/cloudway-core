import { Test, TestingModule } from '@nestjs/testing';
import { AirlineStatisticService } from './airline-statistic.service';

describe('AirlineStatisticService', () => {
  let service: AirlineStatisticService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AirlineStatisticService],
    }).compile();

    service = module.get<AirlineStatisticService>(AirlineStatisticService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
