import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';
import * as bcrypt from 'bcrypt';//mã hóa mật khẩu

@Injectable()
export class UserService {
  constructor(private supabsaeService: SupabaseService) {}
  async create(createUserDto: CreateUserDto) {
    createUserDto.passwordHash = await bcrypt.hash(createUserDto.passwordHash, 10);//hash mật khẩu với độ phức tạp 10
    const { data, error } = await this.supabsaeService.supabaseClient
      .from('users')
      .insert(createUserDto)
      .select()
      .single();
    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  async findAll() {
    //bat dong bo
    const { data, error } = await this.supabsaeService.supabaseClient
      .from('users')
      .select('*');
    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabsaeService.supabaseClient
      .from('users')
      .select('*')
      .eq('id', id) //so sanh bằng hai id
      .single(); //lấy một bản ghi
    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const { data, error } = await this.supabsaeService.supabaseClient
      .from('users')
      .update(updateUserDto)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabsaeService.supabaseClient
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    return data;
  }
  //đăng nhập
  async login(udto: { email: string; password_hash: string }) {
    const { data: user, error } = await this.supabsaeService.supabaseClient
      .from('users')
      .select('*')
      .eq('email', udto.email)
      .single();

    if (error) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const valid = await bcrypt.compare(udto.password_hash, user.password_hash);
    if (!valid)
      throw new HttpException('sai thông tin đăng nhập', HttpStatus.UNAUTHORIZED);
    return { message: 'đăng nhập thành công' };
  }
}

