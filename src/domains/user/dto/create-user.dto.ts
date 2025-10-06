import {
  IS_LENGTH,
  IsAlpha,
  IsAscii,
  IsEmail,
  IsNotEmpty,
  IsNotIn,
} from 'class-validator';

export class CreateUserDto {
  //validation ánh xạ dữ liệu
  //   id: string;
  //   @IsNotEmpty()//không được để trống
  //   email: string;
  //   @IsNotEmpty()
  //   password_hash: string;
  //   dob: Date;
  //   @IsNotEmpty()
  //   full_name: string;
  //   @IsNotEmpty()
  //   phone: string;
  email: string;
  password: string;
}
