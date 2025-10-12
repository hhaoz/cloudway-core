import { IsNotEmpty, IsString } from 'class-validator';
export class CreateFareBucketDto {
  id: string;
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsString()
  code: string;
  @IsNotEmpty()
  @IsString()
  class_type: string;
  @IsNotEmpty()
  @IsString()
  description: string;
  created_at: Date;
  updated_at: Date;
}
