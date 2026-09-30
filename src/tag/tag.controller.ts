import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { OptionalJwtGuard } from 'src/auth/guards/optional-jwt.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { Tag } from '@prisma/client';
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
  @UseGuards(OptionalJwtGuard)
  async getTagArticles(
    @Param('tagName') tagName: string,
    @Query() queryDto: GetTagsDto,
    @CurrentUser('id') viewerId?: string,
  ): Promise<TagArticles> {
    return this.tagService.getTagArticles(tagName, queryDto, viewerId);
  }
}
