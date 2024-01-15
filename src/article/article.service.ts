import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';
import { Article, Prisma, User } from '@prisma/client';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesSort, GetAllArticlesDto } from './dto/get-all-articles.dto';

@Injectable()
export class ArticleService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllArticles(queryDto: GetAllArticlesDto): Promise<Article[]> {
    const { author, tag, sort, pageIndex = 0, pageSize = 20 } = queryDto;
    const prismaSort: Prisma.ArticleOrderByWithRelationInput[] = [];

    switch (sort) {
      case ArticlesSort.TOP:
        prismaSort.push({ favoritesCount: 'desc' });
        break;

      case ArticlesSort.OLDEST:
        prismaSort.push({ createdAt: 'asc' });
        break;

      default:
        prismaSort.push({ createdAt: 'desc' });
        break;
    }

    return await this.prismaService.article.findMany({
      where: {
        author: {
          name: {
            contains: author,
          },
        },
        tagList: {
          some: {
            name: {
              contains: tag,
            },
          },
        },
      },
      skip: pageIndex * pageSize,
      take: pageSize,
      include: this.articleIncludeOpts(),
      orderBy: prismaSort,
    });
  }

  async getSingleArticle(slug: string): Promise<Article> {
    const article = await this.findArticleBySlug(slug);

    if (!article) {
      throw new NotFoundException('Article does not exist');
    }

    return await this.prismaService.article.findUnique({
      where: {
        slug,
      },
      include: this.articleIncludeOpts(),
    });
  }

  async createArticle(id: string, dto: CreateArticleDto) {
    const article = await this.prismaService.article.findUnique({
      where: {
        slug: slugify(dto.title, { lower: true }),
      },
    });

    if (article) {
      throw new ConflictException('Article with this title already exists');
    }

    return await this.prismaService.article.create({
      data: {
        ...dto,
        slug: slugify(dto.title, { lower: true }),
        tagList: {
          connectOrCreate: dto.tagList.map((tag) => ({
            where: {
              name: tag.name,
            },
            create: {
              name: tag.name,
            },
          })),
        },
        authorId: id,
      },
      include: this.articleIncludeOpts(),
    });
  }

  async updateArticle(
    id: string,
    slug: string,
    dto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.findArticleBySlug(slug);

    if (!article) {
      throw new NotFoundException('Article does not exist');
    }

    if (article.authorId !== id) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    return await this.prismaService.article.update({
      where: {
        slug,
      },
      data: {
        ...dto,
        slug: slugify(dto.title, { lower: true }),
      },
      include: this.articleIncludeOpts(),
    });
  }

  async deleteArticle(id: string, slug: string): Promise<void> {
    const article = await this.findArticleBySlug(slug);

    if (!article) {
      throw new NotFoundException('Article does not exist');
    }

    if (article.authorId !== id) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.prismaService.article.delete({
      where: {
        slug,
      },
    });
  }

  async favoriteArticle(user: User, slug: string) {
    const article = await this.prismaService.article.findUnique({
      where: {
        slug,
      },
      include: {
        favorited: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article does not exist');
    }

    const isFavorited = article.favorited.some(
      (favoritedUserId) => favoritedUserId.id === user.id,
    );

    return await this.prismaService.article.update({
      where: {
        slug,
      },
      data: {
        favorited: { connect: { ...user } },
        favoritesCount: isFavorited
          ? article.favoritesCount
          : article.favoritesCount + 1,
      },
      include: this.articleIncludeOpts(),
    });
  }

  async unfavoriteArticle(user: User, slug: string) {
    const article = await this.prismaService.article.findUnique({
      where: {
        slug,
      },
      include: {
        favorited: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article does not exist');
    }

    const isFavorited = article.favorited.some(
      (favoritedUserId) => favoritedUserId.id === user.id,
    );

    return await this.prismaService.article.update({
      where: {
        slug,
      },
      data: {
        favorited: { disconnect: { ...user } },
        favoritesCount: isFavorited
          ? article.favoritesCount - 1
          : article.favoritesCount,
      },
      include: this.articleIncludeOpts(),
    });
  }

  private async findArticleBySlug(slug: string): Promise<Article> {
    return this.prismaService.article.findUnique({
      where: {
        slug,
      },
    });
  }

  private articleIncludeOpts() {
    return {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          image: true,
          followers: true,
          following: true,
          createdAt: true,
        },
      },
      tagList: true,
      favorited: {
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          image: true,
          createdAt: true,
        },
      },
    };
  }
}
