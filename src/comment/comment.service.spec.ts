import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../testing/mocks';
import { CommentService } from './comment.service';

describe('CommentService', () => {
  let service: CommentService;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(CommentService);
  });

  it('applies bounded pagination', async () => {
    prisma.comment.findMany.mockResolvedValue([]);
    await service.getComments('article-1', { page: 2, per_page: 10 });

    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });
});
