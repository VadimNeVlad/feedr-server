import {
  Controller,
  Put,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

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

  @Post(':fuid/follow')
  @UseGuards(JwtGuard)
  async followUser(
    @CurrentUser() currentUser: User,
    @Param('fuid') fuid: string,
  ): Promise<User> {
    return this.userService.followUser(currentUser, fuid);
  }
}
