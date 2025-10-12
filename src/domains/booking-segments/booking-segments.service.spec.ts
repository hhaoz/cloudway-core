import { Test, TestingModule } from '@nestjs/testing';
import { BookingSegmentsService } from './booking-segments.service';

describe('BookingSegmentsService', () => {
  let service: BookingSegmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingSegmentsService],
    }).compile();

    service = module.get<BookingSegmentsService>(BookingSegmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
