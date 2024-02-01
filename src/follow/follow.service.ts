import { Injectable } from '@nestjs/common';
import { Follow } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetFollowsDto } from './dto/get-follows';

@Injectable()
export class FollowService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFollowings(
    queryDto: GetFollowsDto,
    userId: string,
  ): Promise<Follow[]> {
    const { per_page = 100 } = queryDto;

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
    });
  }

  async getFollowers(
    queryDto: GetFollowsDto,
    userId: string,
  ): Promise<Follow[]> {
    const { per_page = 100 } = queryDto;

    return await this.prismaService.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
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
    });
  }
}
