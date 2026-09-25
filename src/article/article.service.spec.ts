import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { cloudinaryMock, createPrismaMock } from '../testing/mocks';
import { ArticleService } from './article.service';

describe('ArticleService', () => {
  let service: ArticleService;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinaryMock },
      ],
    }).compile();

    service = module.get(ArticleService);
  });

  it('updates only the supplied fields and keeps the slug and image', async () => {
    prisma.article.findUnique.mockResolvedValue({
      id: 'article-1',
      authorId: 'user-1',
    });
    prisma.article.update.mockResolvedValue({ id: 'article-1' });

    await service.updateArticle(
      'user-1',
      'article-1',
      { body: 'Updated body' },
      undefined,
    );

    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { body: 'Updated body' } }),
    );
  });

  it('favorites by authenticated user id only', async () => {
    prisma.article.update.mockResolvedValue({ id: 'article-1' });

    await service.favoriteArticle(
      { id: 'user-1', email: 'alice@example.com' },
      'article-1',
    );

    expect(prisma.article.update.mock.calls[0][0].data).toEqual({
      favorited: { connect: { id: 'user-1' } },
    });
  });
});
