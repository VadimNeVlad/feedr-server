import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { cloudinaryMock, createPrismaMock } from '../testing/mocks';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinaryMock },
      ],
    }).compile();

    service = module.get(UserService);
  });

  it('maps only allowed profile fields to Prisma', async () => {
    prisma.user.update.mockResolvedValue({ id: 'user-1', name: 'Alice' });

    await service.updateCurrentUser('user-1', {
      name: 'Alice',
      bio: 'Profile',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Alice',
          websiteUrl: undefined,
          location: undefined,
          bio: 'Profile',
        },
      }),
    );
    expect(prisma.user.update.mock.calls[0][0].data).not.toHaveProperty(
      'password',
    );
  });
});
