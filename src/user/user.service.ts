import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashSync } from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUser(id: string): Promise<User> {
    const user = await this.findUser(id);

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
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
        password: hashSync(dto.password, 10),
      },
    });
  }

  private async findUser(id: string): Promise<User> {
    return await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
  }
}
