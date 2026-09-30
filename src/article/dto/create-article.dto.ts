import { Transform, plainToInstance } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
export class ArticleTagDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;
}
export function transformTags(value: unknown): unknown {
  try {
    const parsed: unknown =
      typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return parsed;
    return parsed.map((item) => plainToInstance(ArticleTagDto, item));
  } catch {
    return value;
  }
}
export class CreateArticleDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title!: string;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(100_000)
  body!: string;
  @Transform(({ value }) => transformTags(value))
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  tagList!: ArticleTagDto[];
}
