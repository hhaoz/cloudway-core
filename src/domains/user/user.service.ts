import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';
import * as bcrypt from 'bcrypt';//mã hóa mật khẩu
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import type { Multer } from 'multer';
import { AccountLockedException } from '../../common/exceptions/account-locked.exception';

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

    // Kiểm tra trạng thái tài khoản
    if (user.account_status === 'LOCKED') {
      throw new AccountLockedException();
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
    updateData: { full_name?: string; phone?: string; email?: string },
  ) {
    const { full_name, phone, email } = updateData;

    const { data, error } = await this.supabaseService.client
      .from('users')
      .update({
        full_name,
        phone,
        email,
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

  async updateAvatar(id: string, file: Multer.File) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }

    const fileExt = (file.originalname.split('.').pop() || 'png').toLowerCase();
    const folder = `${id}`;
    const path = `${folder}/${id}.${fileExt}`;

    // Xoá toàn bộ file cũ trong thư mục của user trước khi upload mới
    try {
      const { data: existingFiles, error: listError } = await this.supabaseService.client
        .storage
        .from('avatars')
        .list(folder);

      if (!listError && Array.isArray(existingFiles) && existingFiles.length > 0) {
        const pathsToRemove = existingFiles.map((f: any) => `${folder}/${f.name}`);
        await this.supabaseService.client.storage.from('avatars').remove(pathsToRemove);
      }
    } catch (_) {
      // Bỏ qua lỗi dọn dẹp để không chặn upload
    }

    const { data: uploadResult, error: uploadError } = await this.supabaseService.client
      .storage
      .from('avatars')
      .upload(path, file.buffer, {
        upsert: true,
        contentType: file.mimetype || 'image/png',
      });

    if (uploadError) {
      throw new HttpException(uploadError.message, HttpStatus.BAD_REQUEST);
    }

    const { data: { publicUrl } } = this.supabaseService.client
      .storage
      .from('avatars')
      .getPublicUrl(path);

    const { data, error } = await this.supabaseService.client
      .from('users')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Cập nhật ảnh đại diện thành công', avatar_url: publicUrl, user: data };
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

  async getUserByRole(role: 'CUSTOMER' | 'AIRLINE' | 'ADMIN') {
    const { data, error } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('role', role);
    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  /** Admin tạo tài khoản AIRLINE có password (không invite) */
  async createAirlineUser(dto: {
    email: string;
    full_name: string;
    phone?: string;
    password: string;
    airline_id: string;
  }) {
    // Lấy logo của hãng bay để đặt avatar mặc định
    const { data: airline, error: airlineErr } = await this.supabaseService.client
      .from('airlines')
      .select('id, logo')
      .eq('id', dto.airline_id)
      .single();

    if (airlineErr) {
      throw new HttpException(airlineErr.message, HttpStatus.BAD_REQUEST);
    }
    // 1) Tạo user trong Supabase Auth với email/password, xác nhận ngay
    const createRes = await this.supabaseService.client.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
    });

    if (createRes.error) {
      throw new HttpException(createRes.error.message, HttpStatus.BAD_REQUEST);
    }

    const authUser = createRes.data.user;
    if (!authUser) {
      throw new HttpException('Cannot create auth user', HttpStatus.BAD_REQUEST);
    }

    // 2) Ghi vào bảng users với role = AIRLINE
    const { data: user, error: insertErr } = await this.supabaseService.client
      .from('users')
      .insert({
        id: authUser.id,
        email: dto.email,
        full_name: dto.full_name,
        phone: dto.phone ?? null,
        role: 'AIRLINE',
        avatar_url: airline?.logo ?? null,
      })
      .select()
      .single();

    if (insertErr) {
      // rollback: xoá auth user nếu insert DB fail
      await this.supabaseService.client.auth.admin.deleteUser(authUser.id);
      throw new HttpException(insertErr.message, HttpStatus.BAD_REQUEST);
    }

    // 3) Liên kết airline (bắt buộc)
    const { error: linkErr } = await this.supabaseService.client
      .from('airline_users')
      .insert({ user_id: authUser.id, airline_id: dto.airline_id });
    if (linkErr) {
      throw new HttpException(linkErr.message, HttpStatus.BAD_REQUEST);
    }

    return { user, auth_user_id: authUser.id };
  }

  /**
   * Admin cập nhật trạng thái tài khoản (ACTIVE, LOCKED)
   */
  async updateAccountStatus(userId: string, accountStatus: 'ACTIVE' | 'LOCKED') {
    const { data, error } = await this.supabaseService.client
      .from('users')
      .update({
        account_status: accountStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    const statusMessage = {
      'ACTIVE': 'đã kích hoạt',
      'LOCKED': 'đã khóa'
    };

    return { 
      message: `Tài khoản ${statusMessage[accountStatus]} thành công`, 
      user: data 
    };
  }

  /**
   * Di chuyển toàn bộ avatar_url hiện tại (đang trỏ URL ngoài) vào Supabase Storage
   * và cập nhật lại cột avatar_url thành public URL mới trong bucket.
   * Chỉ admin gọi.
   */
  async migrateAllAvatarsToBucket() {
    // Lấy tất cả user có avatar_url
    const { data: users, error } = await this.supabaseService.client
      .from('users')
      .select('id, avatar_url');

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    const results: Array<{ id: string; from?: string; to?: string; status: 'skipped' | 'migrated' | 'failed'; reason?: string }> = [];

    for (const user of users || []) {
      const id: string = (user as any).id;
      const url: string | null = (user as any).avatar_url ?? null;

      if (!url) {
        results.push({ id, status: 'skipped', reason: 'no avatar_url' });
        continue;
      }

      // Bỏ qua nếu có vẻ như đã ở trong Supabase Storage bucket 'avatars'
      if (url.includes('/storage/v1/object/public/avatars/')) {
        results.push({ id, from: url, status: 'skipped', reason: 'already in bucket' });
        continue;
      }

      try {
        // Tải ảnh về
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`download failed: ${response.status} ${response.statusText}`);
        }

        const arrayBuf = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        // Xác định content-type/extension
        const contentType = response.headers.get('content-type') || 'image/png';
        const extFromType = contentType.split('/').pop() || 'png';
        const urlExt = (url.split('?')[0].split('#')[0].split('.').pop() || '').toLowerCase();
        const fileExt = (urlExt && urlExt.length <= 5) ? urlExt : extFromType;

        const path = `${id}/${id}.${fileExt}`;

        // Upload lên Supabase Storage (bucket 'public')
        const { error: uploadError } = await this.supabaseService.client
          .storage
          .from('avatars')
          .upload(path, buffer, {
            upsert: true,
            contentType,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Lấy public URL
        const { data: publicData } = this.supabaseService.client
          .storage
          .from('avatars')
          .getPublicUrl(path);

        const newUrl = publicData.publicUrl;

        // Cập nhật DB
        const { error: updateError } = await this.supabaseService.client
          .from('users')
          .update({
            avatar_url: newUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        results.push({ id, from: url, to: newUrl, status: 'migrated' });
      } catch (e: any) {
        results.push({ id, from: url, status: 'failed', reason: e?.message || 'unknown' });
      }
    }

    return { message: 'Avatar migration completed', results };
  }

}

