import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';
import * as wasi from 'node:wasi';

@Injectable()
export  class UserService {
  constructor(private supabsaeService: SupabaseService) {}
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll() {//bat dong bo
     const {data, error}=await  this.supabsaeService.supabaseClient
       .from('users')
       .select('*')
    if(error) {
      throw new HttpException(error.message,HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  async findOne(id: string) {
    const {data, error}=await  this.supabsaeService.supabaseClient
      .from('users')
      .select('*')
      .eq('id',id)//so sanh bằng hai id
      .single();//lấy một bản ghi
    if(error) {
      throw new HttpException(error.message,HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string) {
    const {data,error}=await this.supabsaeService.supabaseClient
      .from('users')
      .delete()
      .eq('id',id)
      .select()
      .single();
    if (error) {
      throw new HttpException(error.message,HttpStatus.BAD_REQUEST);
    }
    return data;
  }
}

