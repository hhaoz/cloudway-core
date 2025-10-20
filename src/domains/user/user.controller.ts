import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Post()
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.userService.create(createUserDto);
  // }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Roles(Role.AIRLINE, Role.CUSTOMER, Role.ADMIN)
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(id, updateUserDto);
  // }


  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.userService.remove(id);
  // }
  // @Post('login')
  // login(@Body() body: {email: string, password: string}) {
  //   return this.userService.login(body);
  // }


  @Patch(':id/profile')
  updateProfile(
    @Param('id') id: string,
    @Body() body: { full_name?: string; phone?: string; email?: string },
  ) {
    return this.userService.updateProfile(id, body);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Multer.File,
  ) {
    return this.userService.updateAvatar(id, file);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  updateRole(
    @Param('id') id: string,
    @Body() body: { role: 'CUSTOMER' | 'AIRLINE' },
  ) {
    return this.userService.updateRole(id, body.role);
  }

  @Get('role/:role')
  @Roles(Role.ADMIN)
  getUserByRole(@Param('role') role: 'CUSTOMER' | 'AIRLINE' | 'ADMIN') {
    return this.userService.getUserByRole(role);
  }

  @Post('migrate-avatars')
  @Roles(Role.ADMIN)
  migrateAvatars() {
    return this.userService.migrateAllAvatarsToBucket();
  }

  @Post('admin/airline')
  @Roles(Role.ADMIN)
  createAirlineUser(
    @Body()
    body: {
      email: string;
      full_name: string;
      phone?: string;
      password: string;
      airline_id: string;
    },
  ) {
    return this.userService.createAirlineUser(body);
  }

  @Patch(':id/account-status')
  @Roles(Role.ADMIN)
  updateAccountStatus(
    @Param('id') id: string,
    @Body() body: { account_status: 'ACTIVE' | 'LOCKED' },
  ) {
    return this.userService.updateAccountStatus(id, body.account_status);
  }
}
