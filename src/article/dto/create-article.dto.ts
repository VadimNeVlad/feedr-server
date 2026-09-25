import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ArticleTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;
}

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100_000)
  body!: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ArticleTagDto)
  tagList!: ArticleTagDto[];
}
