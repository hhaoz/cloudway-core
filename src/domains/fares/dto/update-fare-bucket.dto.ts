import { PartialType } from '@nestjs/mapped-types';
import { CreateFareBucketDto } from './create-fare-bucket.dto';

export class UpdateFareBucketDto extends PartialType(CreateFareBucketDto){}
