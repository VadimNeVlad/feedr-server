import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTagsDto } from './dto/create-tags.dto';
import { Tag } from '@prisma/client';
import { TagsCount } from './interfaces/tags-count';
import { GetTagsDto } from './dto/get-tags.dto';

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

  async createTags(dto: CreateTagsDto[]): Promise<TagsCount> {
    return await this.prismaService.tag.createMany({
      data: dto,
      skipDuplicates: true,
    });
  }
}
