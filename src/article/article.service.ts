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
import {
  ArticlesSort,
  GetArticlesQueryParamsDto,
} from './dto/get-articles-query-params.dto';
import { ArticleData } from './interfaces/article-data';

@Injectable()
export class ArticleService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllArticles(
    queryDto: GetArticlesQueryParamsDto,
  ): Promise<ArticleData> {
    const { sort_by, page = 0, per_page = 10, q } = queryDto;
    const where: Prisma.ArticleWhereInput = {
      title: {
        contains: q,
        mode: 'insensitive',
      },
    };

    const orderBy: Prisma.ArticleOrderByWithRelationInput =
      this.getOrderBy(sort_by);

    const [articles, articlesCount] = await Promise.all([
      this.prismaService.article.findMany({
        where,
        skip: page * per_page,
        take: +per_page,
        include: this.articleIncludeOpts(),
        orderBy,
      }),
      this.prismaService.article.count({ where }),
    ]);

    return { articles, _count: articlesCount };
  }

  async getArticlesByAuthor(
    authorId: string,
    queryDto: GetArticlesQueryParamsDto,
  ): Promise<ArticleData> {
    const { page = 0, per_page = 10 } = queryDto;
    const where: Prisma.ArticleWhereInput = {
      authorId,
    };

    const [articles, articlesCount] = await Promise.all([
      this.prismaService.article.findMany({
        where,
        skip: page * per_page,
        take: +per_page,
        include: this.articleIncludeOpts(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.article.count({ where }),
    ]);

    return { articles, _count: articlesCount };
  }

  async getReadingList(uid: string): Promise<ArticleData> {
    const where: Prisma.ArticleWhereInput = {
      favorited: { some: { id: uid } },
    };

    const [articles, articlesCount] = await Promise.all([
      this.prismaService.article.findMany({
        where,
        include: this.articleIncludeOpts(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.article.count({ where }),
    ]);

    return { articles, _count: articlesCount };
  }

  async getSingleArticle(id: string): Promise<Article> {
    const article = await this.findArticleById(id);
    return article;
  }

  async createArticle(
    id: string,
    dto: CreateArticleDto,
    file: Express.Multer.File,
  ) {
    const tagList = JSON.parse(dto.tagList);
    const slug = slugify(dto.title, { lower: true });

    const existingArticle = await this.prismaService.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      throw new ConflictException('Article with this title already exists');
    }

    return await this.prismaService.article.create({
      data: {
        ...dto,
        slug: slug,
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

    if (article.authorId !== uid) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.prismaService.comment.deleteMany({
      where: { articleId: article.id },
    });

    await this.prismaService.article.delete({
      where: { id },
    });
  }

  async favoriteArticle(user: User, id: string) {
    return await this.prismaService.article.update({
      where: { id },
      data: { favorited: { connect: { ...user } } },
      include: this.articleIncludeOpts(),
    });
  }

  async unfavoriteArticle(user: User, id: string) {
    return await this.prismaService.article.update({
      where: { id },
      data: { favorited: { disconnect: { ...user } } },
      include: this.articleIncludeOpts(),
    });
  }

  private async findArticleById(id: string): Promise<Article> {
    const article = await this.prismaService.article.findUnique({
      where: { id },
      include: this.articleIncludeOpts(),
    });

    if (!article) {
      throw new NotFoundException('Article does not exist');
    }

    return article;
  }

  private getOrderBy(
    sortBy: ArticlesSort,
  ): Prisma.ArticleOrderByWithRelationInput {
    switch (sortBy) {
      case ArticlesSort.TOP:
        return { favorited: { _count: 'desc' } };
      case ArticlesSort.OLDEST:
        return { createdAt: 'asc' };
      default:
        return { createdAt: 'desc' };
    }
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
          createdAt: true,
        },
      },
      tagList: true,
      favorited: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          comments: true,
          favorited: true,
        },
      },
    };
  }
}
