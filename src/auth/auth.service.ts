import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { authUserSelect } from './auth.select';
import { getJwtSecret } from './config/jwt-secrets';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth';
import { Token, Tokens } from './interfaces/token';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email address already exists',
      );
    }

    const user = await this.prismaService.user.create({
      data: {
        email,
        name: dto.name,
        password: await hash(dto.password, 12),
      },
      select: authUserSelect,
    });
    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { email: this.normalizeEmail(dto.email) },
      select: { id: true, email: true, password: true },
    });

    if (!user || !(await compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);
    return { user: await this.getAuthUser(user.id), ...tokens };
  }

  async getNewTokens(dto: RefreshTokenDto): Promise<AuthResponse> {
    let payload: Token;

    try {
      payload = await this.jwtService.verifyAsync<Token>(dto.refreshToken, {
        secret: getJwtSecret(this.configService, 'refresh'),
        issuer: 'feeds-backend',
        audience: 'feeds-refresh',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, refreshTokenHash: true },
    });

    if (
      !user?.refreshTokenHash ||
      !this.tokenHashesMatch(dto.refreshToken, user.refreshTokenHash)
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    return { user: await this.getAuthUser(user.id), ...tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  private async generateTokens(
    user: Pick<User, 'id' | 'email'>,
  ): Promise<Tokens> {
    const base = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...base, type: 'access', jti: randomUUID() },
        {
          secret: getJwtSecret(this.configService, 'access'),
          expiresIn: '15m',
          issuer: 'feeds-backend',
          audience: 'feeds-api',
        },
      ),
      this.jwtService.signAsync(
        { ...base, type: 'refresh', jti: randomUUID() },
        {
          secret: getJwtSecret(this.configService, 'refresh'),
          expiresIn: '7d',
          issuer: 'feeds-backend',
          audience: 'feeds-refresh',
        },
      ),
    ]);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: this.hashToken(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  private getAuthUser(id: string) {
    return this.prismaService.user.findUniqueOrThrow({
      where: { id },
      select: authUserSelect,
    });
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private tokenHashesMatch(token: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashToken(token), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
