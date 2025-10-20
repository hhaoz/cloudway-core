import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UserService } from '../user/user.service';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { UnauthorizedException } from '@nestjs/common';
import { AccountLockedException } from '../../common/exceptions/account-locked.exception';

// Default avatar URL cho user mới
const DEFAULT_AVATAR_URL = 'https://api.dicebear.com/7.x/avataaars/svg?seed=';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async supabaseLogin(token: string) {
    // Gọi Supabase để lấy thông tin user từ token
    const { data, error } = await this.supabaseService.client.auth.getUser(token);
    if (error || !data?.user) throw new UnauthorizedException('Token không hợp lệ');

    const supaUser = data.user;
    const metadata = supaUser.user_metadata || {};

    // Kiểm tra trạng thái tài khoản trước khi cho phép đăng nhập
    const { data: userRecord, error: userError } = await this.supabaseService.client
      .from('users')
      .select('id, account_status')
      .eq('id', supaUser.id)
      .single();

    if (userError) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng');
    }

    // Kiểm tra trạng thái tài khoản
    if (userRecord.account_status === 'LOCKED') {
      throw new AccountLockedException();
    }

    // Tạo full_name từ first_name và last_name nếu có
    const fullName = metadata.first_name && metadata.last_name
      ? `${metadata.first_name} ${metadata.last_name}`
      : metadata.full_name || metadata.name || supaUser.email!.split('@')[0];

    // Avatar: ưu tiên avatar_url từ metadata, nếu không có thì dùng default
    const avatarUrl = metadata.avatar_url || `${DEFAULT_AVATAR_URL}${supaUser.id}`;

    // Lưu user vào DB
    const user = await this.userService.upsertUser({
      id: supaUser.id,
      email: supaUser.email!,
      full_name: fullName,
      avatar_url: avatarUrl,
      phone: metadata.phone || null,
      // Không ép role về CUSTOMER nếu user đã tồn tại
      // Nếu muốn map role từ Supabase metadata, có thể truyền role tại đây
    });

    return { message: '✅ Đăng nhập thành công', user };
  }

  async supabaseRegister(token: string) {
    // Verify token và lưu user mới vào DB
    const { data, error } = await this.supabaseService.client.auth.getUser(token);
    if (error || !data?.user) throw new UnauthorizedException('Token không hợp lệ');

    const supaUser = data.user;
    const metadata = supaUser.user_metadata || {};

    // Tạo full_name từ first_name và last_name
    const fullName = metadata.first_name && metadata.last_name
      ? `${metadata.first_name} ${metadata.last_name}`
      : metadata.full_name || metadata.name || supaUser.email!.split('@')[0];

    // Avatar: ưu tiên avatar_url từ metadata, nếu không có thì tạo default dựa trên user ID
    const avatarUrl = metadata.avatar_url || `${DEFAULT_AVATAR_URL}${supaUser.id}`;

    // Lưu user mới vào DB
    const user = await this.userService.upsertUser({
      id: supaUser.id,
      email: supaUser.email!,
      full_name: fullName,
      avatar_url: avatarUrl,
      phone: metadata.phone || null,
      role: 'CUSTOMER',
    });

    return { 
      message: '✅ Đăng ký thành công', 
      user,
      supabase_user: {
        id: supaUser.id,
        email: supaUser.email,
        phone: metadata.phone,
      }
    };
  }
}
