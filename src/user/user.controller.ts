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
  ParseFilePipe,
  FileTypeValidator,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Follow } from './interfaces/follow';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangePasswordDto } from './dto/change-password.dto';

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

  @Put('update-avatar')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(
    @CurrentUser('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<User> {
    return this.userService.updateAvatar(id, file);
  }

  @Put('change-password')
  @UseGuards(JwtGuard)
  async changePassword(
    @CurrentUser('id') id: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.userService.changePassword(id, dto);
  }

  @Delete()
  @UseGuards(JwtGuard)
  async deleteCurrentUser(@CurrentUser('id') id: string): Promise<void> {
    return this.userService.deleteCurrentUser(id);
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
