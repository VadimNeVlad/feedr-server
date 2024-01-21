import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { MulterModule } from '@nestjs/platform-express';
import { articleStorage } from '../config/multer.config';

@Module({
  imports: [PrismaModule, MulterModule.register({ storage: articleStorage })],
  controllers: [ArticleController],
  providers: [ArticleService, JwtGuard],
})
export class ArticleModule {}
