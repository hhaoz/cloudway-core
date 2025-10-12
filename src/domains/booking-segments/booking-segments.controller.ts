import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BookingSegmentsService } from './booking-segments.service';
import { CreateBookingSegmentDto } from './dto/create-booking-segment.dto';
import { UpdateBookingSegmentDto } from './dto/update-booking-segment.dto';

@Controller('booking-segments')
export class BookingSegmentsController {
  constructor(private readonly bookingSegmentsService: BookingSegmentsService) {}

  @Post()
  create(@Body() createBookingSegmentDto: CreateBookingSegmentDto) {
    return this.bookingSegmentsService.create(createBookingSegmentDto);
  }

  @Get()
  findAll() {
    return this.bookingSegmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingSegmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingSegmentDto: UpdateBookingSegmentDto) {
    return this.bookingSegmentsService.update(id, updateBookingSegmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingSegmentsService.remove(id);
  }
}
