import { Test, TestingModule } from '@nestjs/testing';
import { AircraftsController } from './aircrafts.controller';
import { AircraftsService } from './aircrafts.service';

describe('AircraftsController', () => {
  let controller: AircraftsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AircraftsController],
      providers: [AircraftsService],
    }).compile();

    controller = module.get<AircraftsController>(AircraftsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
