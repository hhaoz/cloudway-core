import { Test, TestingModule } from '@nestjs/testing';
import { FlightsInstanceService } from './services/./flights-instance.service';

describe('FlightsInstanceService', () => {
  let service: FlightsInstanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlightsInstanceService],
    }).compile();

    service = module.get<FlightsInstanceService>(FlightsInstanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
