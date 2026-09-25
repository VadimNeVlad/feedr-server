import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('health')
  async health(): Promise<{ status: 'ok' }> {
    await this.prismaService.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
