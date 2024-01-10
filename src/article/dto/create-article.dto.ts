import { Tag } from '@prisma/client';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsArray()
  @IsNotEmpty()
  tagList: Tag[];
}
