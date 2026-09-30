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
    prisma.article.update.mockResolvedValue({ id: 'article-1', favorited: [] });

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

  it('suffixes the slug with the article id so titles may repeat', async () => {
    prisma.article.create.mockResolvedValue({ id: 'x', favorited: [] });

    await service.createArticle('user-1', {
      title: 'Hello World',
      body: 'Body',
      tagList: [],
    });

    const { id, slug } = prisma.article.create.mock.calls[0][0].data;
    expect(slug).toBe(`hello-world-${id.slice(0, 8)}`);
    expect(prisma.article.findUnique).not.toHaveBeenCalled();
  });

  it('keeps the slug suffix when the title changes', async () => {
    prisma.article.findUnique.mockResolvedValue({
      id: 'abcdef12-0000',
      authorId: 'user-1',
    });
    prisma.article.update.mockResolvedValue({ id: 'x', favorited: [] });

    await service.updateArticle('user-1', 'abcdef12-0000', { title: '🎉' });

    expect(prisma.article.update.mock.calls[0][0].data.slug).toBe('abcdef12');
  });

  it('connects each tag name only once', async () => {
    prisma.article.create.mockResolvedValue({ id: 'x', favorited: [] });

    await service.createArticle('user-1', {
      title: 'Tags',
      body: 'Body',
      tagList: [{ name: 'js' }, { name: 'js' }, { name: 'ts' }],
    });

    expect(
      prisma.article.create.mock.calls[0][0].data.tagList.connectOrCreate,
    ).toEqual([
      { where: { name: 'js' }, create: { name: 'js' } },
      { where: { name: 'ts' }, create: { name: 'ts' } },
    ]);
  });

  it('favorites by authenticated user id only', async () => {
    prisma.article.update.mockResolvedValue({ id: 'article-1', favorited: [] });

    await service.favoriteArticle(
      { id: 'user-1', email: 'alice@example.com' },
      'article-1',
    );

    expect(prisma.article.update.mock.calls[0][0].data).toEqual({
      favorited: { connect: { id: 'user-1' } },
    });
  });
});
