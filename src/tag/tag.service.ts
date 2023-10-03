import { ConflictException, Injectable } from '@nestjs/common';
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
    const tagsList = dto.map((name) => name);
    const tagsNameList = [];
    tagsList.map((item) => tagsNameList.push(item.name));

    const tags = await this.prismaService.tag.findMany({
      where: {
        name: { in: tagsNameList },
      },
    });

    if (tags.length) {
      throw new ConflictException('Tag or tags with this name already exists');
    }

    return await this.prismaService.tag.createMany({
      data: tagsList,
    });
  }
}
