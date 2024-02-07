import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ArticlesSort {
  LATEST = 'latest',
  OLDEST = 'oldest',
  TOP = 'top',
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
