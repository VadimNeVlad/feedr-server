import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ArticlesSort {
  LATEST = 'Latest',
  OLDEST = 'Oldest',
  TOP = 'Top',
}

export class GetAllArticlesDto {
  @IsOptional()
  @IsEnum(ArticlesSort)
  sort_by?: ArticlesSort;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  page?: number;

  @IsOptional()
  @IsString()
  per_page?: number;
}
