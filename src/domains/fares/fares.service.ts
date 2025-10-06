import { Injectable } from '@nestjs/common';
import { CreateFareDto } from './dto/create-fare.dto';
import { UpdateFareDto } from './dto/update-fare.dto';

@Injectable()
export class FaresService {
  create(createFareDto: CreateFareDto) {
    return 'This action adds a new fare';
  }

  findAll() {
    return `This action returns all fares`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fare`;
  }

  update(id: number, updateFareDto: UpdateFareDto) {
    return `This action updates a #${id} fare`;
  }

  remove(id: number) {
    return `This action removes a #${id} fare`;
  }
}
