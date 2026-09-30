import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Comment, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsDto } from './dto/get-comments.dto';

const commentInclude = {
  author: { select: { id: true, image: true, name: true } },
} satisfies Prisma.CommentInclude;

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}

  async getComments(
    articleId: string,
    query: GetCommentsDto,
  ): Promise<CommentWithAuthor[]> {
    const { page = 0, per_page = 20 } = query;
    return await this.prismaService.comment.findMany({
      where: { articleId },
      skip: page * per_page,
      take: per_page,
      include: commentInclude,
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
    return await this.prismaService.comment.create({
      data: {
        content: dto.content,
        authorId,
        articleId,
      },
    });
  }

  async updateComment(
    authorId: string,
    id: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    await this.assertCommentAuthor(id, authorId);
    return this.prismaService.comment.update({
      where: { id },
      data: { content: dto.content },
    });
  }

  async deleteComment(authorId: string, id: string): Promise<void> {
    await this.assertCommentAuthor(id, authorId);
    await this.prismaService.comment.delete({ where: { id } });
  }

  private async assertCommentAuthor(
    id: string,
    authorId: string,
  ): Promise<void> {
    const comment = await this.prismaService.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!comment) throw new NotFoundException('Comment does not exist');
    if (comment.authorId !== authorId) {
      throw new ForbiddenException(
        'You are not allowed to modify this comment',
      );
    }
  }
}
