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
import { OptionalJwtGuard } from 'src/auth/guards/optional-jwt.guard';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleResponse } from './article.select';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesQueryParamsDto } from './dto/get-articles-query-params.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticleData } from './interfaces/article-data';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user';
import {
  ImageFileValidator,
  MAX_IMAGE_SIZE,
} from 'src/common/validators/image-file.validator';
import { UploadedFile as UploadedImage } from 'src/common/interfaces/uploaded-file';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  async getAllArticles(
    @Query() queryDto: GetArticlesQueryParamsDto,
    @CurrentUser('id') viewerId?: string,
  ): Promise<ArticleData> {
    return this.articleService.getAllArticles(queryDto, viewerId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  async getSingleArticle(
    @Param('id') id: string,
    @CurrentUser('id') viewerId?: string,
  ): Promise<ArticleResponse> {
    return this.articleService.getSingleArticle(id, viewerId);
  }

  @Get('author/:authorId')
  @UseGuards(OptionalJwtGuard)
  async getArticlesByAuthor(
    @Param('authorId') authorId: string,
    @Query() queryDto: GetArticlesQueryParamsDto,
    @CurrentUser('id') viewerId?: string,
  ): Promise<ArticleData> {
    return this.articleService.getArticlesByAuthor(
      authorId,
      queryDto,
      viewerId,
    );
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
  ): Promise<ArticleResponse> {
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
  ): Promise<ArticleResponse> {
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
  ): Promise<ArticleResponse> {
    return this.articleService.favoriteArticle(user, id);
  }

  @Delete(':id/favorite')
  @UseGuards(JwtGuard)
  async unfavoriteArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ArticleResponse> {
    return this.articleService.unfavoriteArticle(user, id);
  }
}
