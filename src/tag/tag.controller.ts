import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { CreateTagsDto } from './dto/create-tags.dto';
import { Tag } from '@prisma/client';
import { TagsCount } from './interfaces/tags-count';
import { GetTagsDto } from './dto/get-tags.dto';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async getAllTags(@Query() queryDto: GetTagsDto): Promise<Tag[]> {
    return this.tagService.getTags(queryDto);
  }

  @Post()
  @UseGuards(JwtGuard)
  async createTags(@Body() dto: CreateTagsDto[]): Promise<TagsCount> {
    return this.tagService.createTags(dto);
  }
}
