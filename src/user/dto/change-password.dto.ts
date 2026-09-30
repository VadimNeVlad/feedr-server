import { MaxPasswordBytes } from '../../common/validators/max-password-bytes';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @MinLength(10)
  @IsString()
  @IsNotEmpty()
  @MaxPasswordBytes()
  newPassword!: string;

  @MinLength(6)
  @IsString()
  @IsNotEmpty()
  @MaxPasswordBytes()
  currentPassword!: string;
}
