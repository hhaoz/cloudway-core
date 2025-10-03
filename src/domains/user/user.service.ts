import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';


@Injectable()
export  class UserService {
  constructor(private supabsaeService: SupabaseService) {}
  async create(createUserDto: CreateUserDto) {
    const {data,error}= await this.supabsaeService.supabaseClient
      .from('users')
      .insert(createUserDto)
      .select()
      .single();
    if (error) {
      throw new HttpException(error.message,HttpStatus.BAD_REQUEST);
    }
    return data;
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await  this.findOne(id);
    if(!user) {
      throw new HttpException('User not found',HttpStatus.NOT_FOUND);
    }
    //cập nhật
    const {data,error}=await this.supabsaeService.supabaseClient
      .from('users')
      .update(updateUserDto)
      .eq('id',id)
      .select()
      .single();
    if (error) {
      throw new HttpException(error.message,HttpStatus.BAD_REQUEST);
    }
    return data;
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

