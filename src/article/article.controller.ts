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
import { GetArticlesQueryParamsDto } from './dto/get-articles-query-params.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticleData } from './interfaces/article-data';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async getAllArticles(
    @Query() queryDto: GetArticlesQueryParamsDto,
  ): Promise<ArticleData> {
    return this.articleService.getAllArticles(queryDto);
  }

  @Get(':id')
  async getSingleArticle(@Param('id') id: string): Promise<Article> {
    return this.articleService.getSingleArticle(id);
  }

  @Get('author/:authorId')
  async getArticlesByAuthor(
    @Param('authorId') authorId: string,
    @Query() queryDto: GetArticlesQueryParamsDto,
  ): Promise<ArticleData> {
    return this.articleService.getArticlesByAuthor(authorId, queryDto);
  }

  @Get('user/reading-list')
  @UseGuards(JwtGuard)
  async getReadingList(@CurrentUser('id') uid: string): Promise<ArticleData> {
    return this.articleService.getReadingList(uid);
  }

  @Post()
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('image'))
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
  @UseInterceptors(FileInterceptor('image'))
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
