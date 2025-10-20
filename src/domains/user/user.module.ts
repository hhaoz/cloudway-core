import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
import {UserService} from './user.service';
import { UserController } from './user.controller';
import { SupabaseService } from '../../services/supabase/supabase.service';
// import { User } from './entities/user.entity';

@Module({
  imports: [], // TypeORM disabled - using Supabase
  controllers: [UserController],
  providers: [UserService, SupabaseService],
  exports: [UserService],
})
export class UserModule {}
