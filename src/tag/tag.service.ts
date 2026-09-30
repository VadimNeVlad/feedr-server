import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Tag } from '@prisma/client';
import { GetTagsDto } from './dto/get-tags.dto';
import { TagArticles } from './interfaces/tag-articles';
import {
  articleInclude,
  articleOrder,
  presentArticle,
} from '../article/article.select';

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  async getTags(queryDto: GetTagsDto): Promise<Tag[]> {
    const { page = 0, per_page = 100, q } = queryDto;

    const tags = await this.prismaService.tag.findMany({
      where: {
        name: {
          contains: q,
          mode: 'insensitive',
        },
      },
      skip: page * per_page,
      take: per_page,
      select: {
        name: true,
        id: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: [{ articles: { _count: 'desc' } }, { id: 'asc' }],
    });

    return tags;
  }

  async getTagArticles(
    tagName: string,
    queryDto: GetTagsDto,
    viewerId?: string,
  ): Promise<TagArticles> {
    const { sort_by, page = 0, per_page = 10 } = queryDto;

    const orderBy = articleOrder(sort_by);

    const tag = await this.prismaService.tag.findUnique({
      where: {
        name: tagName.trim().toLowerCase(),
      },
      select: {
        articles: {
          include: articleInclude(viewerId),
          skip: page * per_page,
          take: per_page,
          orderBy,
        },
        _count: true,
      },
    });

    if (!tag) throw new NotFoundException('Tag does not exist');
    return { ...tag, articles: tag.articles.map(presentArticle) };
  }
}
