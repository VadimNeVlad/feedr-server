import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';
import { Article, Prisma } from '@prisma/client';
import { UpdateArticleDto } from './dto/update-article.dto';
import {
  ArticlesSort,
  GetArticlesQueryParamsDto,
} from './dto/get-articles-query-params.dto';
import { ArticleData } from './interfaces/article-data';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user';
import { UploadedFile } from 'src/common/interfaces/uploaded-file';

@Injectable()
export class ArticleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
        take: per_page,
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
        take: per_page,
        include: this.articleIncludeOpts(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.article.count({ where }),
    ]);

    return { articles, _count: articlesCount };
  }

  async getReadingList(
    uid: string,
    queryDto: GetArticlesQueryParamsDto,
  ): Promise<ArticleData> {
    const { page = 0, per_page = 10 } = queryDto;
    const where: Prisma.ArticleWhereInput = {
      favorited: { some: { id: uid } },
    };

    const [articles, articlesCount] = await Promise.all([
      this.prismaService.article.findMany({
        where,
        skip: page * per_page,
        take: per_page,
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

  async createArticle(id: string, dto: CreateArticleDto, file: UploadedFile) {
    const slug = this.createSlug(dto.title);

    const existingArticle = await this.prismaService.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      throw new ConflictException('Article with this title already exists');
    }

    const image = file ? await this.cloudinaryService.uploadImage(file) : '';

    return await this.prismaService.article.create({
      data: {
        title: dto.title,
        body: dto.body,
        slug,
        image: image && image.secure_url,
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
    uid: string,
    id: string,
    dto: UpdateArticleDto,
    file: UploadedFile,
  ): Promise<Article> {
    const { title, body, image } = dto;
    const article = await this.findArticleById(id);

    if (article.authorId !== uid) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    const uploadedImageUrl = file
      ? (await this.cloudinaryService.uploadImage(file)).secure_url
      : undefined;

    const updatedArticle = await this.prismaService.article.update({
      where: {
        id,
      },
      data: {
        ...(title !== undefined ? { title, slug: this.createSlug(title) } : {}),
        ...(body !== undefined ? { body } : {}),
        ...(uploadedImageUrl
          ? { image: uploadedImageUrl }
          : image !== undefined
            ? { image }
            : {}),
      },
      include: this.articleIncludeOpts(),
    });

    if (uploadedImageUrl) {
      await this.cloudinaryService.deleteImageByUrl(article.image);
    }

    return updatedArticle;
  }

  async deleteArticle(uid: string, id: string): Promise<void> {
    const article = await this.findArticleById(id);

    if (article.authorId !== uid) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.prismaService.$transaction([
      this.prismaService.comment.deleteMany({
        where: { articleId: article.id },
      }),
      this.prismaService.article.delete({ where: { id } }),
    ]);

    await this.cloudinaryService.deleteImageByUrl(article.image);
  }

  async favoriteArticle(user: AuthenticatedUser, id: string) {
    return await this.prismaService.article.update({
      where: { id },
      data: { favorited: { connect: { id: user.id } } },
      include: this.articleIncludeOpts(),
    });
  }

  async unfavoriteArticle(user: AuthenticatedUser, id: string) {
    return await this.prismaService.article.update({
      where: { id },
      data: { favorited: { disconnect: { id: user.id } } },
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
    sortBy?: ArticlesSort,
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

  private createSlug(title: string): string {
    const slug = slugify(title, { lower: true, strict: true, trim: true });
    if (!slug) {
      throw new BadRequestException('Title must contain slug-compatible text');
    }
    return slug;
  }

  private articleIncludeOpts() {
    return {
      author: {
        select: {
          id: true,
          name: true,
          bio: true,
          image: true,
          createdAt: true,
        },
      },
      tagList: true,
      _count: {
        select: {
          comments: true,
          favorited: true,
        },
      },
    };
  }
}
