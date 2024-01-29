import { Injectable } from '@nestjs/common';
import { Follow } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFollowings(userId: string): Promise<Follow[]> {
    return await this.prismaService.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            bio: true,
            image: true,
          },
        },
      },
    });
  }
}
