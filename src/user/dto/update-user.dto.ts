import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @MinLength(6)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;
}
