import { Test, TestingModule } from '@nestjs/testing';
import { FaresController } from './controllers/fares.controller';
import { FaresService } from './services/fares.service';

describe('FaresController', () => {
  let controller: FaresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaresController],
      providers: [FaresService],
    }).compile();

    controller = module.get<FaresController>(FaresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
