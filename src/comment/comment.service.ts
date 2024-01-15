import { Injectable } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}

  async getComments(articleId: string): Promise<Comment[]> {
    return await this.prismaService.comment.findMany({
      where: {
        articleId,
      },
    });
  }

  async createComment(
    authorId: string,
    articleId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    return await this.prismaService.comment.create({
      data: {
        ...dto,
        authorId,
        articleId,
      },
    });
  }
}
