import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('supabase-login')
  async supabaseLogin(@Body('token') token: string) {
    return this.authService.supabaseLogin(token);
  }

  @Post('supabase-register')
  async supabaseRegister(@Body('token') token: string) {
    return this.authService.supabaseRegister(token);
  }
}
