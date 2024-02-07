import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { CreateTagsDto } from './dto/create-tags.dto';
import { Tag } from '@prisma/client';
import { TagsCount } from './interfaces/tags-count';
import { GetTagsDto } from './dto/get-tags.dto';
import { TagArticles } from './interfaces/tag-articles';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async getTags(@Query() queryDto: GetTagsDto): Promise<Tag[]> {
    return this.tagService.getTags(queryDto);
  }

  @Get(':tagName')
  async getTagArticles(
    @Param('tagName') tagName: string,
    @Query() queryDto: GetTagsDto,
  ): Promise<TagArticles> {
    return this.tagService.getTagArticles(tagName, queryDto);
  }

  @Post()
  @UseGuards(JwtGuard)
  async createTags(@Body() dto: CreateTagsDto[]): Promise<TagsCount> {
    return this.tagService.createTags(dto);
  }
}
