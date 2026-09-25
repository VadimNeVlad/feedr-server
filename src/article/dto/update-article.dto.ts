import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100_000)
  body?: string;

  @IsString()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  image?: string;
}
