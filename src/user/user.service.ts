import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { compare, hash } from 'bcrypt';
import { Follow } from './interfaces/follow';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import {
  PrivateUser,
  PublicUser,
  privateUserProfileSelect,
  privateUserSelect,
  publicUserProfileSelect,
} from './user.select';
import { UploadedFile } from 'src/common/interfaces/uploaded-file';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getCurrentUser(id: string): Promise<PrivateUser> {
    return this.findUser(id, true);
  }

  async getUserById(id: string, viewerId?: string): Promise<PublicUser> {
    const user = await this.findUser(id, false);
    const isFollowing = viewerId
      ? (await this.prismaService.follow.count({
          where: { followerId: viewerId, followingId: id },
        })) > 0
      : false;
    return { ...user, isFollowing };
  }

  async updateCurrentUser(id: string, dto: UpdateUserDto) {
    const { name, websiteUrl, location, bio } = dto;

    return await this.prismaService.user.update({
      where: { id },
      data: { name, websiteUrl, location, bio },
      select: privateUserSelect,
    });
  }

  async updateAvatar(id: string, file: UploadedFile) {
    const currentUser = await this.prismaService.user.findUnique({
      where: { id },
      select: { image: true },
    });
    if (!currentUser) throw new NotFoundException('User does not exist');

    const asset = { kind: 'avatars' as const, id };
    const image = await this.cloudinaryService.uploadImage(file, asset);

    let updatedUser;
    try {
      updatedUser = await this.prismaService.user.update({
        where: { id },
        data: { image: image.secure_url },
        select: privateUserSelect,
      });
    } catch (error) {
      await this.cloudinaryService.deleteImageByUrl(image.secure_url, asset);
      throw error;
    }
    await this.cloudinaryService.deleteImageByUrl(currentUser.image, asset);
    return updatedUser;
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const { newPassword, currentPassword } = dto;
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    const isPasswordCorrect = await compare(currentPassword, user.password);

    if (!isPasswordCorrect) {
      throw new BadRequestException('Invalid password');
    }

    await this.prismaService.user.update({
      where: { id },
      data: {
        password: await hash(newPassword, 12),
        refreshTokenHash: null,
      },
    });
  }

  async deleteCurrentUser(id: string): Promise<void> {
    const images = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        image: true,
        articles: { select: { id: true, image: true } },
      },
    });
    if (!images) throw new NotFoundException('User does not exist');

    await this.prismaService.user.delete({
      where: {
        id,
      },
    });

    await Promise.all([
      this.cloudinaryService.deleteImageByUrl(images.image, {
        kind: 'avatars',
        id,
      }),
      ...images.articles.map((article) =>
        this.cloudinaryService.deleteImageByUrl(article.image, {
          kind: 'articles',
          id: article.id,
        }),
      ),
    ]);
  }

  async followUser(id: string, fuid: string): Promise<Follow> {
    if (id === fuid) {
      throw new ConflictException('You cannot follow yourself');
    }

    const followingUser = await this.prismaService.user.findUnique({
      where: { id: fuid },
      select: { id: true },
    });

    if (!followingUser) {
      throw new NotFoundException('User does not exist');
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
      where: { id: fuid },
      select: { id: true },
    });

    if (!followingUser) {
      throw new NotFoundException('User does not exist');
    }

    const deleteResult = await this.prismaService.follow.deleteMany({
      where: {
        followerId: id,
        followingId: followingUser.id,
      },
    });

    return { count: deleteResult.count };
  }

  private async findUser(
    id: string,
    includePrivateData: true,
  ): Promise<PrivateUser>;
  private async findUser(
    id: string,
    includePrivateData: false,
  ): Promise<PublicUser>;
  private async findUser(
    id: string,
    includePrivateData: boolean,
  ): Promise<PrivateUser | PublicUser> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      select: includePrivateData
        ? privateUserProfileSelect
        : publicUserProfileSelect,
    });

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }
}
