import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../testing/mocks';
import { TagService } from './tag.service';

describe('TagService', () => {
  let service: TagService;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(TagService);
  });

  it('limits tag queries', async () => {
    prisma.tag.findMany.mockResolvedValue([]);
    await service.getTags({ per_page: 25 });

    expect(prisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25 }),
    );
  });

  it('looks up tag articles by normalized tag name', async () => {
    prisma.tag.findUnique.mockResolvedValue({
      articles: [],
      _count: { articles: 0 },
    });
    await service.getTagArticles(' JavaScript ', {});

    expect(prisma.tag.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: 'javascript' } }),
    );
  });
});
