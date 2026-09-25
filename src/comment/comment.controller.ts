import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment } from '@prisma/client';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsDto } from './dto/get-comments.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':articleId')
  async getComments(
    @Param('articleId') articleId: string,
    @Query() query: GetCommentsDto,
  ): Promise<Comment[]> {
    return this.commentService.getComments(articleId, query);
  }

  @Post(':articleId')
  @UseGuards(JwtGuard)
  async createComment(
    @CurrentUser('id') authorId: string,
    @Param('articleId') articleId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<Comment> {
    return this.commentService.createComment(authorId, articleId, dto);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  async updateComment(
    @CurrentUser('id') authorId: string,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ): Promise<Comment> {
    return this.commentService.updateComment(authorId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async deleteComment(
    @CurrentUser('id') authorId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.commentService.deleteComment(authorId, id);
  }
}
