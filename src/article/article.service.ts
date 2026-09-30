import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArticleTagDto, CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesQueryParamsDto } from './dto/get-articles-query-params.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user';
import { UploadedFile } from 'src/common/interfaces/uploaded-file';
import { articleInclude, articleOrder, presentArticle } from './article.select';
@Injectable()
export class ArticleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  private async list(
    where: Prisma.ArticleWhereInput,
    query: GetArticlesQueryParamsDto,
    viewerId?: string,
  ) {
    const { page = 0, per_page = 10, sort_by } = query;
    const [articles, total] = await Promise.all([
      this.prismaService.article.findMany({
        where,
        skip: page * per_page,
        take: per_page,
        include: articleInclude(viewerId),
        orderBy: articleOrder(sort_by),
      }),
      this.prismaService.article.count({ where }),
    ]);
    return { articles: articles.map(presentArticle), _count: total };
  }
  getAllArticles(query: GetArticlesQueryParamsDto, viewerId?: string) {
    return this.list(
      { title: { contains: query.q, mode: 'insensitive' } },
      query,
      viewerId,
    );
  }
  getArticlesByAuthor(
    authorId: string,
    query: GetArticlesQueryParamsDto,
    viewerId?: string,
  ) {
    return this.list({ authorId }, query, viewerId);
  }
  getReadingList(uid: string, query: GetArticlesQueryParamsDto) {
    return this.list({ favorited: { some: { id: uid } } }, query, uid);
  }
  async getSingleArticle(id: string, viewerId?: string) {
    return presentArticle(await this.findArticleById(id, viewerId));
  }
  async createArticle(uid: string, dto: CreateArticleDto, file?: UploadedFile) {
    const id = randomUUID();
    const slug = this.createSlug(dto.title, id);
    const asset = { kind: 'articles' as const, id };
    const upload = file
      ? await this.cloudinaryService.uploadImage(file, asset)
      : undefined;
    try {
      return presentArticle(
        await this.prismaService.article.create({
          data: {
            id,
            title: dto.title,
            body: dto.body,
            slug,
            image: upload?.secure_url || '',
            authorId: uid,
            tagList: { connectOrCreate: this.connectTags(dto.tagList) },
          },
          include: articleInclude(uid),
        }),
      );
    } catch (error) {
      await this.cloudinaryService.deleteImageByUrl(upload?.secure_url, asset);
      throw error;
    }
  }
  async updateArticle(
    uid: string,
    id: string,
    dto: UpdateArticleDto,
    file?: UploadedFile,
  ) {
    const article = await this.findArticleById(id, uid);
    if (article.authorId !== uid)
      throw new ForbiddenException('You are not allowed to update this post');
    if (file && dto.removeImage)
      throw new BadRequestException(
        'Choose either an image replacement or removal',
      );
    const asset = { kind: 'articles' as const, id };
    const upload = file
      ? await this.cloudinaryService.uploadImage(file, asset)
      : undefined;
    try {
      const updated = await this.prismaService.article.update({
        where: { id },
        data: {
          ...(dto.title !== undefined
            ? { title: dto.title, slug: this.createSlug(dto.title, id) }
            : {}),
          ...(dto.body !== undefined ? { body: dto.body } : {}),
          ...(dto.tagList !== undefined
            ? {
                tagList: {
                  set: [],
                  connectOrCreate: this.connectTags(dto.tagList),
                },
              }
            : {}),
          ...(upload
            ? { image: upload.secure_url }
            : dto.removeImage
              ? { image: '' }
              : {}),
        },
        include: articleInclude(uid),
      });
      if (upload || dto.removeImage)
        await this.cloudinaryService.deleteImageByUrl(article.image, asset);
      return presentArticle(updated);
    } catch (error) {
      await this.cloudinaryService.deleteImageByUrl(upload?.secure_url, asset);
      throw error;
    }
  }
  async deleteArticle(uid: string, id: string) {
    const article = await this.findArticleById(id, uid);
    if (article.authorId !== uid)
      throw new ForbiddenException('You are not allowed to delete this post');
    // Comments and favorites are removed by ON DELETE CASCADE.
    await this.prismaService.article.delete({ where: { id } });
    await this.cloudinaryService.deleteImageByUrl(article.image, {
      kind: 'articles',
      id,
    });
  }
  async favoriteArticle(user: AuthenticatedUser, id: string) {
    return presentArticle(
      await this.prismaService.article.update({
        where: { id },
        data: { favorited: { connect: { id: user.id } } },
        include: articleInclude(user.id),
      }),
    );
  }
  async unfavoriteArticle(user: AuthenticatedUser, id: string) {
    return presentArticle(
      await this.prismaService.article.update({
        where: { id },
        data: { favorited: { disconnect: { id: user.id } } },
        include: articleInclude(user.id),
      }),
    );
  }
  private async findArticleById(id: string, viewerId?: string) {
    const article = await this.prismaService.article.findUnique({
      where: { id },
      include: articleInclude(viewerId),
    });
    if (!article) throw new NotFoundException('Article does not exist');
    return article;
  }
  // The id suffix keeps slugs unique, so different authors may reuse a title.
  private createSlug(title: string, id: string) {
    const base = slugify(title, { lower: true, strict: true, trim: true });
    return [base, id.slice(0, 8)].filter(Boolean).join('-');
  }
  private connectTags(tags: ArticleTagDto[]) {
    return [...new Set(tags.map((tag) => tag.name))].map((name) => ({
      where: { name },
      create: { name },
    }));
  }
}
