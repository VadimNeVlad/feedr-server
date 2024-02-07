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
import { articleStorage } from '../config/multer.config';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async getAllArticles(
    @Query() queryDto: GetAllArticlesDto,
  ): Promise<Article[]> {
    return this.articleService.getAllArticles(queryDto);
  }

  @Get(':id')
  async getSingleArticle(@Param('id') id: string): Promise<Article> {
    return this.articleService.getSingleArticle(id);
  }

  @Get('author/:authorId')
  async getArticlesByAuthor(
    @Param('authorId') authorId: string,
  ): Promise<Article[]> {
    return this.articleService.getArticlesByAuthor(authorId);
  }

  @Get('tag/:tagName')
  async getArticlesByTag(
    @Param('tagName') tagName: string,
  ): Promise<Article[]> {
    return this.articleService.getArticlesByTag(tagName);
  }

  @Post()
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('image', { storage: articleStorage }))
  async createArticle(
    @CurrentUser('id') id: string,
    @Body() dto: CreateArticleDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ): Promise<Article> {
    return this.articleService.createArticle(id, dto, file);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('image', { storage: articleStorage }))
  async updateArticle(
    @CurrentUser('id') uid: string,
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ): Promise<Article> {
    return this.articleService.updateArticle(uid, id, dto, file);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async deleteArticle(
    @CurrentUser('id') uid: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.articleService.deleteArticle(uid, id);
  }

  @Post(':id/favorite')
  @UseGuards(JwtGuard)
  async favoriteArticle(@CurrentUser() user: User, @Param('id') id: string) {
    return this.articleService.favoriteArticle(user, id);
  }

  @Delete(':id/favorite')
  @UseGuards(JwtGuard)
  async unfavoriteArticle(@CurrentUser() user: User, @Param('id') id: string) {
    return this.articleService.unfavoriteArticle(user, id);
  }
}
