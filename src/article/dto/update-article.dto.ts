import { IsOptional, IsString } from 'class-validator';

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsOptional()
  image?: string;
}
