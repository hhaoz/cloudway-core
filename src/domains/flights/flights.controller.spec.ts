import { Test, TestingModule } from '@nestjs/testing';
import { FlightsInstanceController } from './controllers/flights-instance .controller';
import { FlightsInstanceService } from './services/./flights-instance.service';

describe('FlightsInstanceController', () => {
  let controller: FlightsInstanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlightsInstanceController],
      providers: [FlightsInstanceService],
    }).compile();

    controller = module.get<FlightsInstanceController>(FlightsInstanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
