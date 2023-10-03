import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';
import { Article } from '@prisma/client';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticleService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllArticles(author: string, tag: string): Promise<Article[]> {
    return await this.prismaService.article.findMany({
      where: {
        OR: [
          {
            author: {
              name: {
                contains: author,
              },
            },
          },
          {
            tagList: {
              some: {
                name: {
                  contains: tag,
                },
              },
            },
          },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            bio: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
      include: {
        author: {
          select: {
            name: true,
            bio: true,
            image: true,
          },
        },
      },
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
          create: {
            name: 'test',
          },
        },
        authorId: id,
      },
      include: {
        author: {
          select: {
            name: true,
            bio: true,
            image: true,
          },
        },
        tagList: true,
      },
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
      include: {
        author: {
          select: {
            name: true,
            bio: true,
            image: true,
          },
        },
      },
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

  private async findArticleBySlug(slug: string): Promise<Article> {
    return this.prismaService.article.findUnique({
      where: {
        slug,
      },
    });
  }
}
