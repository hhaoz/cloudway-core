import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';
import * as bcrypt from 'bcrypt';//mã hóa mật khẩu
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    private supabaseService: SupabaseService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}
  // async create(createUserDto: CreateUserDto) {
  //   const { data, error } = await this.supabsaeService.supabaseClient
  //     .from('users')
  //     .insert(createUserDto)
  //     .select()
  //     .single();
  //   if (error) {
  //     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  //   }
  //   return data;
  // }

  async findAll() {
    //bat dong bo
    const { data, error } = await this.supabaseService.client
      .from('users')
      .select('*');
    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  async getProfile(id: string) {
    const { data: user, error } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    // Nếu không phải AIRLINE thì trả về user như cũ
    if (!user || user.role !== 'AIRLINE') {
      return user;
    }

    // Nếu là AIRLINE: lấy thêm danh sách airline mà user này thuộc về
    const { data: airlineLinks, error: auError } = await this.supabaseService.client
      .from('airline_users')
      .select(`
        airline:airline_id (
          id,
          iata_code,
          name,
          logo
        )
      `)
      .eq('user_id', id);

    if (auError) {
      throw new HttpException(auError.message, HttpStatus.BAD_REQUEST);
    }

    const airlines = (airlineLinks || [])
      .map((x: any) => x.airline)
      .filter(Boolean);

    return {
      ...user,
      airlines,
    };
  }

  // async update(id: string, updateUserDto: UpdateUserDto) {
  //   const user = await this.findOne(id);
  //   if (!user) {
  //     throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  //   }
  //   //cập nhật
  //   const { data, error } = await this.supabsaeService.supabaseClient
  //     .from('users')
  //     .update(updateUserDto)
  //     .eq('id', id)
  //     .select()
  //     .single();
  //   if (error) {
  //     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  //   }
  //   return data;
  // }

  // async remove(id: string) {
  //   const { data, error } = await this.supabsaeService.supabaseClient
  //     .from('users')
  //     .delete()
  //     .eq('id', id)
  //     .select()
  //     .single();
  //   if (error) {
  //     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  //   }
  //   return data;
  // }
  // //đăng nhập
  // async login(udto:CreateUserDto) {
  //   const { data: user, error } = await this.supabsaeService.supabaseClient
  //     .from('users')
  //     .select('*')
  //     .eq('email', udto.email)
  //     .single();

  //   if (error) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

  //   const valid = await bcrypt.compare(udto.password, user.password_hash);
  //   if (!valid)
  //     throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

  //   return { message: 'Login successful', user };
  // }

  /**
   * Tạo mới hoặc cập nhật user dựa trên Supabase ID hoặc email.
   * Nếu user đã tồn tại, update lại full_name hoặc role nếu có.
   */
  async upsertUser(data: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role?: 'CUSTOMER' | 'AIRLINE' | 'ADMIN';
    phone?: string;
  }): Promise<User> {
    const { id, email, full_name, avatar_url, role, phone } = data;

    let user = await this.userRepo.findOne({ where: { id } });

    if (user) {
      // Nếu user đã tồn tại, update lại thông tin
      user.fullName = full_name;
      if (avatar_url !== undefined) user.avatarUrl = avatar_url;
      user.phone = phone ?? user.phone;
      // Chỉ cập nhật role nếu có truyền vào; nếu không giữ nguyên
      user.role = role ?? user.role;
      return await this.userRepo.save(user);
    }

    // Nếu chưa có user → tạo mới
    user = this.userRepo.create({
      id,
      email,
      fullName: full_name,
      avatarUrl: avatar_url,
      phone,
      role: role ?? 'CUSTOMER',
      passwordHash: null, // null vì đăng nhập bằng Supabase Auth
    });

    return await this.userRepo.save(user);
  //   const { data, error } = await this.supabsaeService.supabaseClient
  //     .from('users')
  //     .update(updateUserDto)
  //     .eq('id', id)
  //     .select()
  //     .single();
  //   if (error) {
  //     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  //   }
  //   return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.client
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
    const { data: user, error } = await this.supabaseService.client
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



  async updateProfile(
    id: string,
    updateData: { full_name?: string; phone?: string; avatar_url?: string },
  ) {
    const { full_name, phone, avatar_url } = updateData;

    const { data, error } = await this.supabaseService.client
      .from('users')
      .update({
        full_name,
        phone,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Cập nhật hồ sơ thành công', user: data };
  }


  async updateRole(id: string, newRole: 'CUSTOMER' | 'AIRLINE') {
    const { data, error } = await this.supabaseService.client
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    return { message: `Đã cập nhật vai trò người dùng thành ${newRole}`, user: data };
  }

}

