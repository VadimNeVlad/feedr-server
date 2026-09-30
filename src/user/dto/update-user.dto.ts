import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((dto) => dto.websiteUrl !== '')
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
    require_valid_protocol: true,
  })
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
