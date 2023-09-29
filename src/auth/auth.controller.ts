import { Controller, Post, Body } from '@nestjs/common';
import { UseGuards } from '@nestjs/common/decorators';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './interfaces/auth';
import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<User> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtGuard)
  @Post('login/access-token')
  async getNewTokens(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.getNewTokens(dto);
  }
}
