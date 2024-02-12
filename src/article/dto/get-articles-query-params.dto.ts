import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ArticlesSort {
  LATEST = 'latest',
  OLDEST = 'oldest',
  TOP = 'top',
}

export class GetArticlesQueryParamsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(ArticlesSort)
  sort_by?: ArticlesSort;

  @IsOptional()
  @IsString()
  page?: number;

  @IsOptional()
  @IsString()
  per_page?: number;
}
