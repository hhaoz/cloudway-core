import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { UserModule } from '../user/user.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
