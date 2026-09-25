import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './interfaces/auth';
import { JwtGuard } from './guards/jwt.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post('refresh-token')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async getNewTokens(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.getNewTokens(dto);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  async logout(@CurrentUser('id') id: string): Promise<void> {
    return this.authService.logout(id);
  }
}
