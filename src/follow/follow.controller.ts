import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { Follow } from '@prisma/client';
import { GetFollowsDto } from './dto/get-follows';

@Controller()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Get(':id/following')
  @UseGuards(JwtGuard)
  async getFollowings(
    @Query() queryDto: GetFollowsDto,
    @Param('id') id: string,
  ): Promise<Follow[]> {
    return this.followService.getFollowings(queryDto, id);
  }

  @Get(':id/followers')
  @UseGuards(JwtGuard)
  async getFollowers(
    @Query() queryDto: GetFollowsDto,
    @Param('id') id: string,
  ): Promise<Follow[]> {
    return this.followService.getFollowers(queryDto, id);
  }
}
