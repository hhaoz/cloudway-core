import { Test, TestingModule } from '@nestjs/testing';
import { AirlineStatisticController } from './airline-statistic.controller';
import { AirlineStatisticService } from './airline-statistic.service';

describe('AirlineStatisticController', () => {
  let controller: AirlineStatisticController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AirlineStatisticController],
      providers: [AirlineStatisticService],
    }).compile();

    controller = module.get<AirlineStatisticController>(AirlineStatisticController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
