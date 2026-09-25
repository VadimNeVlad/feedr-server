import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ArticlesSort } from 'src/article/dto/get-articles-query-params.dto';

export class GetTagsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page?: number;

  @IsOptional()
  @IsEnum(ArticlesSort)
  sort_by?: ArticlesSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;
}
