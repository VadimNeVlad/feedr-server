import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { CreateTagsDto } from './dto/create-tags.dto';
import { Tag } from '@prisma/client';
import { TagsCount } from './interfaces/tags-count';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async getAllTags(): Promise<Tag[]> {
    return this.tagService.getTags();
  }

  @Post()
  @UseGuards(JwtGuard)
  async createTags(@Body() dto: CreateTagsDto[]): Promise<TagsCount> {
    return this.tagService.createTags(dto);
  }
}
