import { MaxPasswordBytes } from '../../common/validators/max-password-bytes';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  @MaxLength(72)
  @IsString()
  @MaxPasswordBytes()
  password!: string;
}
