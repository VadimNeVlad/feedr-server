import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetFollowsDto } from './dto/get-follows';

@Injectable()
export class FollowService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getFollows(
    queryDto: GetFollowsDto,
    userId: string,
    isFollowing: boolean,
    viewerId?: string,
  ) {
    const { page = 0, per_page = 20 } = queryDto;
    const select = {
      id: true,
      name: true,
      bio: true,
      image: true,
      createdAt: true,
      followers: {
        where: { followerId: viewerId || '' },
        select: { followerId: true },
      },
      _count: {
        select: {
          followers: true,
          following: true,
          articles: true,
          comments: true,
        },
      },
    } as const;
    const follows = await this.prismaService.follow.findMany({
      where: isFollowing ? { followerId: userId } : { followingId: userId },
      include: { follower: { select }, following: { select } },
      skip: page * per_page,
      take: per_page,
      orderBy: [
        { createdAt: 'desc' },
        { followerId: 'asc' },
        { followingId: 'asc' },
      ],
    });
    const presentUser = (value: (typeof follows)[number]['following']) => {
      const { followers, ...user } = value;
      return { ...user, isFollowing: followers.length > 0 };
    };

    return follows.map((follow) => ({
      ...follow,
      follower: presentUser(follow.follower),
      following: presentUser(follow.following),
    }));
  }

  getFollowings(queryDto: GetFollowsDto, userId: string, viewerId?: string) {
    return this.getFollows(queryDto, userId, true, viewerId);
  }

  getFollowers(queryDto: GetFollowsDto, userId: string, viewerId?: string) {
    return this.getFollows(queryDto, userId, false, viewerId);
  }
}

export type FollowWithUsers = Awaited<
  ReturnType<FollowService['getFollowings']>
>[number];
