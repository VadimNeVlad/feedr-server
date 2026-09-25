import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;
}
