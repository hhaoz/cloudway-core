import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BookingSegmentsService } from './booking-segments.service';
import { CreateBookingSegmentDto } from './dto/create-booking-segment.dto';
import { UpdateBookingSegmentDto } from './dto/update-booking-segment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('booking-segments')
export class BookingSegmentsController {
  constructor(
    private readonly bookingSegmentsService: BookingSegmentsService,
  ) {}

  @Post()
  @Roles(Role.CUSTOMER)
  create(@Body() createBookingSegmentDto: CreateBookingSegmentDto) {
    return this.bookingSegmentsService.create(createBookingSegmentDto);
  }

  @Get()
  @Roles(Role.AIRLINE)
  findAll() {
    return this.bookingSegmentsService.findAll();
  }

  @Get(':id')
  @Roles(Role.AIRLINE, Role.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.bookingSegmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.AIRLINE, Role.CUSTOMER)
  update(
    @Param('id') id: string,
    @Body() updateBookingSegmentDto: UpdateBookingSegmentDto,
  ) {
    return this.bookingSegmentsService.update(id, updateBookingSegmentDto);
  }

  @Delete(':id')
  @Roles(Role.AIRLINE)
  remove(@Param('id') id: string) {
    return this.bookingSegmentsService.remove(id);
  }
}
