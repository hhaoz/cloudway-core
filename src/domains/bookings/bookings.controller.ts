import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreateBookingWithPassengersDto } from './dto/create-booking-with-passengers.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.AIRLINE)
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Post('with-passengers')
  @Roles(Role.CUSTOMER)
  createWithPassengers(@Body() dto: CreateBookingWithPassengersDto) {
    return this.bookingsService.createBookingWithPassengers(dto);
  }

  @Get()
  @Roles(Role.AIRLINE)
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('pnr/:pnrCode')
  @Roles(Role.AIRLINE, Role.CUSTOMER, Role.ADMIN)
  findByPNR(@Param('pnrCode') pnrCode: string) {
    return this.bookingsService.getBookingByPNR(pnrCode);
  }

  // @Get(':id')
  // @Roles(Role.AIRLINE)
  // findOne(@Param('id') id: string) {
  //   return this.bookingsService.getBookingDetails(id);
  // }

  @Get(':id/booking-details')
  @Roles(Role.CUSTOMER, Role.AIRLINE, Role.ADMIN)
  getBookingForFrontend(@Param('id') id: string) {
    return this.bookingsService.getBookingForFrontend(id);
  }

  @Patch(':id')
  @Roles(Role.AIRLINE)
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':id')
  @Roles(Role.AIRLINE)
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }


}
