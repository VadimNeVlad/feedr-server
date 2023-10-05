import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ArticlesSort {
  NEWEST = 'Newest',
  OLDEST = 'Oldest',
  TOP = 'Top',
}

export class GetAllArticlesDto {
  @IsOptional()
  @IsEnum(ArticlesSort)
  sort?: ArticlesSort;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  pageIndex?: number;

  @IsOptional()
  @IsString()
  pageSize?: number;
}
