import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';
import { Article, Prisma, Tag, User } from '@prisma/client';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesSort, GetAllArticlesDto } from './dto/get-all-articles.dto';

@Injectable()
export class ArticleService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllArticles(queryDto: GetAllArticlesDto): Promise<Article[]> {
    const { author, tag, sort_by, page = 0, per_page = 10 } = queryDto;
    const prismaSort: Prisma.ArticleOrderByWithRelationInput[] = [];

    switch (sort_by) {
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
      skip: page * per_page,
      take: +per_page,
      include: this.articleIncludeOpts(),
      orderBy: prismaSort,
    });
  }

  async getArticlesByAuthor(authorId: string): Promise<Article[]> {
    return await this.prismaService.article.findMany({
      where: {
        authorId,
      },
      include: this.articleIncludeOpts(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSingleArticle(id: string): Promise<Article> {
    const article = await this.findArticleById(id);

    if (!article) {
      throw new NotFoundException('Article does not exist');
    }

    return await this.prismaService.article.findUnique({
      where: {
        id,
      },
      include: this.articleIncludeOpts(),
    });
  }

  async createArticle(
    id: string,
    dto: CreateArticleDto,
    file: Express.Multer.File,
  ) {
    const tagList = JSON.parse(dto.tagList);
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
        image: file ? file.filename : '',
        tagList: {
          connectOrCreate: tagList.map((tag: Tag) => ({
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
    uid: string,
    id: string,
    dto: UpdateArticleDto,
    file: Express.Multer.File,
  ): Promise<Article> {
    const article = await this.findArticleById(id);

    if (!article) {
      throw new NotFoundException('Article does not exist');
    }

    if (article.authorId !== uid) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    return await this.prismaService.article.update({
      where: {
        id,
      },
      data: {
        ...dto,
        slug: slugify(dto.title, { lower: true }),
        image: file ? file.filename : '',
      },
      include: this.articleIncludeOpts(),
    });
  }

  async deleteArticle(uid: string, id: string): Promise<void> {
    const article = await this.findArticleById(id);

    if (!article) {
      throw new NotFoundException('Article does not exist');
    }

    if (article.authorId !== uid) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.prismaService.comment.deleteMany({
      where: {
        articleId: article.id,
      },
    });

    await this.prismaService.article.delete({
      where: {
        id,
      },
    });
  }

  async favoriteArticle(user: User, id: string) {
    const article = await this.prismaService.article.findUnique({
      where: {
        id,
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
        id,
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

  async unfavoriteArticle(user: User, id: string) {
    const article = await this.prismaService.article.findUnique({
      where: {
        id,
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
        id,
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

  private async findArticleById(id: string): Promise<Article> {
    return this.prismaService.article.findUnique({
      where: {
        id,
      },
    });
  }

  private articleIncludeOpts() {
    return {
      author: {
        select: {
          name: true,
          email: true,
          bio: true,
          image: true,
          createdAt: true,
        },
      },
      tagList: true,
      favorited: true,
    };
  }
}
