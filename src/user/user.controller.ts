import {
  Controller,
  Put,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Follow } from './interfaces/follow';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarStorage } from 'src/config/multer.config';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtGuard)
  async getCurrentUser(@CurrentUser('id') id: string): Promise<User> {
    return this.userService.getCurrentUser(id);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User> {
    return this.userService.getUserById(id);
  }

  @Put()
  @UseGuards(JwtGuard)
  async updateCurrentUser(
    @CurrentUser('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.updateCurrentUser(id, dto);
  }

  @Delete()
  @UseGuards(JwtGuard)
  async deleteCurrentUser(@CurrentUser('id') id: string): Promise<void> {
    return this.userService.deleteCurrentUser(id);
  }

  @Put('update-avatar')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('avatar', { storage: avatarStorage }))
  async updateAvatar(
    @CurrentUser('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<User> {
    return this.userService.updateAvatar(id, file);
  }

  @Post(':fuid/follow')
  @UseGuards(JwtGuard)
  async followUser(
    @CurrentUser('id') id: string,
    @Param('fuid') fuid: string,
  ): Promise<Follow> {
    return this.userService.followUser(id, fuid);
  }

  @Delete(':fuid/follow')
  @UseGuards(JwtGuard)
  async unfollowUser(
    @CurrentUser('id') id: string,
    @Param('fuid') fuid: string,
  ): Promise<{ count: number }> {
    return this.userService.unfollowUser(id, fuid);
  }
}
