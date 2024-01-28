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
      include: {
        author: {
          select: {
            id: true,
            image: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createComment(
    authorId: string,
    articleId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const articleComments = await this.prismaService.article.findUnique({
      where: {
        id: articleId,
      },
      select: {
        commentsCount: true,
      },
    });

    const userComments = await this.prismaService.user.findUnique({
      where: {
        id: authorId,
      },
      select: {
        commentsCount: true,
      },
    });

    await this.prismaService.article.update({
      where: {
        id: articleId,
      },
      data: {
        commentsCount: articleComments.commentsCount + 1,
      },
    });

    await this.prismaService.user.update({
      where: {
        id: authorId,
      },
      data: {
        commentsCount: userComments.commentsCount + 1,
      },
    });

    return await this.prismaService.comment.create({
      data: {
        ...dto,
        authorId,
        articleId,
      },
    });
  }
}
