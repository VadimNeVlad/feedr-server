import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../testing/mocks';
import { FollowService } from './follow.service';

describe('FollowService', () => {
  let service: FollowService;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(FollowService);
  });

  it('paginates following records', async () => {
    prisma.follow.findMany.mockResolvedValue([]);
    await service.getFollowings({ page: 1, per_page: 25 }, 'user-1');

    expect(prisma.follow.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 25, take: 25 }),
    );
  });
});
