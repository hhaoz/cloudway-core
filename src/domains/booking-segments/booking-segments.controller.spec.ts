import { Test, TestingModule } from '@nestjs/testing';
import { BookingSegmentsController } from './booking-segments.controller';
import { BookingSegmentsService } from './booking-segments.service';

describe('BookingSegmentsController', () => {
  let controller: BookingSegmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingSegmentsController],
      providers: [BookingSegmentsService],
    }).compile();

    controller = module.get<BookingSegmentsController>(BookingSegmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
