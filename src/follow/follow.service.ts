import { Injectable } from '@nestjs/common';
import { Follow } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetFollowsDto } from './dto/get-follows';

@Injectable()
export class FollowService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getFollows(
    queryDto: GetFollowsDto,
    userId: string,
    isFollowing: boolean,
  ): Promise<Follow[]> {
    const { per_page = 100 } = queryDto;

    const follows = await this.prismaService.follow.findMany({
      where: isFollowing ? { followerId: userId } : { followingId: userId },
      include: {
        [isFollowing ? 'following' : 'follower']: {
          select: {
            id: true,
            name: true,
            bio: true,
            image: true,
            followers: {
              select: {
                followerId: true,
                followingId: true,
              },
            },
          },
        },
      },
      take: +per_page,
      orderBy: { createdAt: 'desc' },
    });

    return follows;
  }

  async getFollowings(
    queryDto: GetFollowsDto,
    userId: string,
  ): Promise<Follow[]> {
    return await this.getFollows(queryDto, userId, true);
  }

  async getFollowers(
    queryDto: GetFollowsDto,
    userId: string,
  ): Promise<Follow[]> {
    return await this.getFollows(queryDto, userId, false);
  }
}
