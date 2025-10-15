import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('supabase-login')
  async supabaseLogin(@Body('token') token: string) {
    return this.authService.supabaseLogin(token);
  }

  // Example protected route per role
  @Get('me')
  async me(@Req() req: any) {
    // assumes req.user is set by your auth middleware (e.g., JWT)
    return { user: req.user };
  }

  @Get('admin-only')
  @Roles(Role.ADMIN)
  adminOnly() {
    return { ok: true };
  }

  @Get('airline-only')
  @Roles(Role.AIRLINE)
  airlineOnly() {
    return { ok: true };
  }

  @Get('customer-only')
  @Roles(Role.CUSTOMER)
  customerOnly() {
    return { ok: true };
  }

  @Post('supabase-register')
  async supabaseRegister(@Body('token') token: string) {
    return this.authService.supabaseRegister(token);
  }
}
