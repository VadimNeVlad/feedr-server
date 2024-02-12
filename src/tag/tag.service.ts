import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTagsDto } from './dto/create-tags.dto';
import { Prisma, Tag } from '@prisma/client';
import { TagsCount } from './interfaces/tags-count';
import { GetTagsDto } from './dto/get-tags.dto';
import { TagArticles } from './interfaces/tag-articles';
import { ArticlesSort } from 'src/article/dto/get-articles-query-params.dto';

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  async getTags(queryDto: GetTagsDto): Promise<Tag[]> {
    const { per_page = 100, q } = queryDto;

    const tags = await this.prismaService.tag.findMany({
      where: {
        name: {
          contains: q,
        },
      },
      take: +per_page,
      select: {
        name: true,
        id: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
    });

    return tags;
  }

  async getTagArticles(
    tagName: string,
    queryDto: GetTagsDto,
  ): Promise<TagArticles> {
    const { sort_by, page = 0, per_page = 10 } = queryDto;

    const orderBy: Prisma.TagOrderByWithRelationInput =
      this.getOrderBy(sort_by);

    return await this.prismaService.tag.findUnique({
      where: {
        name: tagName,
      },
      select: {
        articles: {
          include: {
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
            favorited: {
              select: {
                id: true,
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
          skip: page * per_page,
          take: +per_page,
          orderBy,
        },
        _count: true,
      },
    });
  }

  async createTags(dto: CreateTagsDto[]): Promise<TagsCount> {
    return await this.prismaService.tag.createMany({
      data: dto,
      skipDuplicates: true,
    });
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
}
