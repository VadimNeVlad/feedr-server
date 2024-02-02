import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { compare, hashSync } from 'bcrypt';
import { User } from '@prisma/client';
import { Follow } from './interfaces/follow';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCurrentUser(id: string): Promise<User> {
    const user = await this.findUser(id);
    delete user.password;

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.findUser(id);
    delete user.password;

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async updateCurrentUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findUser(id);

    if (!user) {
      throw new NotFoundException();
    }

    return this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        ...dto,
      },
    });
  }

  async updateAvatar(id: string, file: Express.Multer.File): Promise<User> {
    if (!file) {
      throw new NotFoundException();
    }

    return await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        image: file.filename,
      },
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const { newPassword, currentPassword } = dto;
    const user = await this.findUser(id);

    if (!user) {
      throw new Error();
    }

    const isPasswordCorrect = await compare(currentPassword, user.password);

    if (!isPasswordCorrect) {
      throw new HttpException('Invalid password', 400);
    }

    await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        password: hashSync(newPassword, 10),
      },
    });
  }

  async deleteCurrentUser(id: string): Promise<void> {
    const user = await this.findUser(id);

    if (!user) {
      throw new NotFoundException();
    }

    await this.prismaService.user.delete({
      where: {
        id,
      },
    });
  }

  async followUser(id: string, fuid: string): Promise<Follow> {
    if (id === fuid) {
      throw new ConflictException('You cannot follow yourself');
    }

    const followingUser = await this.prismaService.user.findUnique({
      where: {
        id: fuid,
      },
      include: {
        followers: true,
        following: true,
      },
    });

    const isFollowed = followingUser.followers.some(
      (follower) => follower.followerId === id,
    );

    if (isFollowed) {
      throw new ConflictException('You have already follow this user');
    }

    return await this.prismaService.follow.create({
      data: {
        followerId: id,
        followingId: followingUser.id,
      },
    });
  }

  async unfollowUser(id: string, fuid: string): Promise<{ count: number }> {
    const followingUser = await this.prismaService.user.findUnique({
      where: {
        id: fuid,
      },
      include: {
        followers: true,
        following: true,
      },
    });

    return await this.prismaService.follow.deleteMany({
      where: {
        followerId: id,
        followingId: followingUser.id,
      },
    });
  }

  private async findUser(id: string): Promise<User> {
    return await this.prismaService.user.findUnique({
      where: {
        id,
      },
      include: {
        followers: {
          select: {
            followerId: true,
          },
        },
        following: {
          select: {
            followingId: true,
          },
        },
      },
    });
  }
}
