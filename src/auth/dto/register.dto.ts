import { MaxPasswordBytes } from '../../common/validators/max-password-bytes';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @MinLength(10)
  @MaxLength(72)
  @IsString()
  @MaxPasswordBytes()
  password!: string;
}
