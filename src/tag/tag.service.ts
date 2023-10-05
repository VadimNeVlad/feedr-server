import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTagsDto } from './dto/create-tags.dto';
import { Tag } from '@prisma/client';
import { TagsCount } from './interfaces/tags-count';

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  async getTags(): Promise<Tag[]> {
    return await this.prismaService.tag.findMany({});
  }

  async createTags(dto: CreateTagsDto[]): Promise<TagsCount> {
    return await this.prismaService.tag.createMany({
      data: dto.map((tagName) => tagName),
      skipDuplicates: true,
    });
  }
}
