import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment } from '@prisma/client';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':articleId')
  async getComments(@Param('articleId') articleId: string): Promise<Comment[]> {
    return this.commentService.getComments(articleId);
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
}
