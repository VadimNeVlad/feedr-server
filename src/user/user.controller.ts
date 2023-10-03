import { Controller, Put, Body, Get } from '@nestjs/common';
import { UseGuards } from '@nestjs/common/decorators';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put()
  @UseGuards(JwtGuard)
  async updateUser(
    @CurrentUser('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.updateUser(id, dto);
  }

  @Get()
  @UseGuards(JwtGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
