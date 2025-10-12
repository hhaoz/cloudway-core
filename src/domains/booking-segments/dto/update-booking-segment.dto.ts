import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingSegmentDto } from './create-booking-segment.dto';

export class UpdateBookingSegmentDto extends PartialType(CreateBookingSegmentDto) {}
