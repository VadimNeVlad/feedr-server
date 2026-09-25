import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, jwtMock } from '../testing/mocks';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtMock },
        {
          provide: ConfigService,
          useValue: { get: () => 'a'.repeat(32) },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('normalizes email, hashes password, and never returns it', async () => {
    const user = {
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice',
      bio: '',
      image: '',
      location: '',
      websiteUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      articles: [],
      favorites: [],
      followers: [],
      following: [],
    };
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);
    jwtMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.register({
      email: ' Alice@Example.com ',
      name: 'Alice',
      password: 'secure-password',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'alice@example.com' }),
      }),
    );
    expect(prisma.user.create.mock.calls[0][0].data.password).not.toBe(
      'secure-password',
    );
    expect(result.user).not.toHaveProperty('password');
    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(prisma.user.update.mock.calls[0][0].data.refreshTokenHash).not.toBe(
      'refresh-token',
    );
  });

  it('does not accept an access token as a refresh token', async () => {
    jwtMock.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'alice@example.com',
      type: 'access',
      jti: 'token-id',
    });

    await expect(
      service.getNewTokens({ refreshToken: 'access-token' }),
    ).rejects.toThrow('Invalid refresh token');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
