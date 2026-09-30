import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { OptionalJwtGuard } from 'src/auth/guards/optional-jwt.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { FollowService, FollowWithUsers } from './follow.service';
import { GetFollowsDto } from './dto/get-follows';

@Controller()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Get(':id/following')
  @UseGuards(OptionalJwtGuard)
  async getFollowings(
    @Query() queryDto: GetFollowsDto,
    @Param('id') id: string,
    @CurrentUser('id') viewerId?: string,
  ): Promise<FollowWithUsers[]> {
    return this.followService.getFollowings(queryDto, id, viewerId);
  }

  @Get(':id/followers')
  @UseGuards(OptionalJwtGuard)
  async getFollowers(
    @Query() queryDto: GetFollowsDto,
    @Param('id') id: string,
    @CurrentUser('id') viewerId?: string,
  ): Promise<FollowWithUsers[]> {
    return this.followService.getFollowers(queryDto, id, viewerId);
  }
}
