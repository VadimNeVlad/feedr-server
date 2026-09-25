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
  MaxFileSizeValidator,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { Article } from '@prisma/client';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesQueryParamsDto } from './dto/get-articles-query-params.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticleData } from './interfaces/article-data';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user';
import { ImageFileValidator } from 'src/common/validators/image-file.validator';
import { UploadedFile as UploadedImage } from 'src/common/interfaces/uploaded-file';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
  async getReadingList(
    @CurrentUser('id') uid: string,
    @Query() queryDto: GetArticlesQueryParamsDto,
  ): Promise<ArticleData> {
    return this.articleService.getReadingList(uid, queryDto);
  }

  @Post()
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    }),
  )
  async createArticle(
    @CurrentUser('id') id: string,
    @Body() dto: CreateArticleDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE }),
          new ImageFileValidator({}),
        ],
        fileIsRequired: false,
      }),
    )
    file: UploadedImage,
  ): Promise<Article> {
    return this.articleService.createArticle(id, dto, file);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    }),
  )
  async updateArticle(
    @CurrentUser('id') uid: string,
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE }),
          new ImageFileValidator({}),
        ],
        fileIsRequired: false,
      }),
    )
    file: UploadedImage,
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
  async favoriteArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.articleService.favoriteArticle(user, id);
  }

  @Delete(':id/favorite')
  @UseGuards(JwtGuard)
  async unfavoriteArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.articleService.unfavoriteArticle(user, id);
  }
}
