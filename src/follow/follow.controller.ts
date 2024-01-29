import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { Follow } from '@prisma/client';

@Controller()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Get(':id/following')
  @UseGuards(JwtGuard)
  async getFollowings(@Param('id') id: string): Promise<Follow[]> {
    return this.followService.getFollowings(id);
  }
}
