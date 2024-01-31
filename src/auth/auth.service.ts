import {
  Injectable,
  ConflictException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { compare, hashSync } from 'bcrypt';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Token, Tokens } from './interfaces/token';
import { AuthResponse } from './interfaces/auth';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { email, name, password } = dto;

    const userExist = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      include: this.authIncludeOpts(),
    });

    if (userExist) {
      throw new ConflictException(
        'User with this email address already exists',
      );
    }

    const user = await this.prismaService.user.create({
      data: {
        email,
        name,
        password: this.hashPassword(password),
      },
      include: this.authIncludeOpts(),
    });

    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const { email, password } = dto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      include: this.authIncludeOpts(),
    });

    if (!user) {
      throw new HttpException('Invalid email or password', 400);
    }

    const isPasswordCorrect = await compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new HttpException('Invalid email or password', 400);
    }

    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  async getNewTokens(dto: RefreshTokenDto): Promise<AuthResponse> {
    const result: Token = await this.jwtService.verifyAsync(dto.refreshToken);

    if (!result) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        email: result.email,
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const data = { id: user.id, email: user.email };

    const accessToken = this.jwtService.sign(data, {
      expiresIn: '1d',
    });

    const refreshToken = this.jwtService.sign(data, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private hashPassword(str: string): string {
    return hashSync(str, 10);
  }

  private authIncludeOpts() {
    return {
      articles: true,
      favorites: true,
      followers: true,
      following: true,
    };
  }
}
