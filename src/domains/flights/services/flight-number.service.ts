import { Injectable } from '@nestjs/common';
import {CreateFlightNumberDto} from '../dto/create-flight-number.dto';
import {UpdateFlightNumberDto } from '../dto/update-flight-number.dto';

@Injectable()
export class FlightNumberService {
  create(createFlightInstanceDto: CreateFlightNumberDto) {
    return 'This action adds a new flight';
  }

  findAll() {
    return `This action returns all flights`;
  }

  findOne(id: string) {
    return `This action returns a #${id} flight`;
  }

  update(id: string, updateFlightDto: UpdateFlightNumberDto) {
    return `This action updates a #${id} flight`;
  }

  remove(id: string) {
    return `This action removes a #${id} flight`;
  }
}

