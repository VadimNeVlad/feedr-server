import {
  Controller,
  Post,
  UseGuards,
  Body,
  Delete,
  Param,
  Put,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { Article, User } from '@prisma/client';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetAllArticlesDto } from './dto/get-all-articles.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage } from '../config/multer.config';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async getAllArticles(
    @Query() queryDto: GetAllArticlesDto,
  ): Promise<Article[]> {
    return this.articleService.getAllArticles(queryDto);
  }

  @Get(':slug')
  async getSingleArticle(@Param('slug') slug: string): Promise<Article> {
    return this.articleService.getSingleArticle(slug);
  }

  @Post()
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('file', { storage }))
  async createArticle(
    @CurrentUser('id') id: string,
    @Body() dto: CreateArticleDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/jpeg/png' })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<Article> {
    return this.articleService.createArticle(id, dto, file);
  }

  @Put(':slug')
  @UseGuards(JwtGuard)
  async updateArticle(
    @CurrentUser('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: UpdateArticleDto,
  ): Promise<Article> {
    return this.articleService.updateArticle(id, slug, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtGuard)
  async deleteArticle(
    @CurrentUser('id') id: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.articleService.deleteArticle(id, slug);
  }

  @Post(':slug/favorite')
  @UseGuards(JwtGuard)
  async favoriteArticle(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
  ) {
    return this.articleService.favoriteArticle(user, slug);
  }

  @Delete(':slug/favorite')
  @UseGuards(JwtGuard)
  async unfavoriteArticle(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
  ) {
    return this.articleService.unfavoriteArticle(user, slug);
  }
}
