import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreateBookingWithPassengersDto } from './dto/create-booking-with-passengers.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Post('with-passengers')
  createWithPassengers(@Body() dto: CreateBookingWithPassengersDto) {
    return this.bookingsService.createBookingWithPassengers(dto);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('pnr/:pnrCode')
  findByPNR(@Param('pnrCode') pnrCode: string) {
    return this.bookingsService.getBookingByPNR(pnrCode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.getBookingDetails(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}
