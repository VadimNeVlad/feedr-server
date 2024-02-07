import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTagsDto } from './dto/create-tags.dto';
import { Prisma, Tag } from '@prisma/client';
import { TagsCount } from './interfaces/tags-count';
import { GetTagsDto } from './dto/get-tags.dto';
import { TagArticles } from './interfaces/tag-articles';
import { ArticlesSort } from 'src/article/dto/get-all-articles.dto';

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  async getTags(queryDto: GetTagsDto): Promise<Tag[]> {
    const { per_page = 100, q } = queryDto;

    return await this.prismaService.tag.findMany({
      where: {
        name: {
          contains: q,
        },
      },
      take: +per_page,
    });
  }

  async getTagArticles(
    tagName: string,
    queryDto: GetTagsDto,
  ): Promise<TagArticles> {
    const { sort_by, page = 0, per_page = 10 } = queryDto;
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
          orderBy: prismaSort,
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
}
