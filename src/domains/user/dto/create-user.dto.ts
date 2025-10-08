import {
  IS_LENGTH,
  IsAlpha,
  IsAscii,
  IsEmail,
  IsNotEmpty,
  IsNotIn,
} from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()//không được để trống
    email: string;
    @IsNotEmpty()
    passwordHash: string;
    @IsNotEmpty()
    full_name: string;
    @IsNotEmpty()
    phone: string;
    created_at: Date;
    updated_at: Date;
}
