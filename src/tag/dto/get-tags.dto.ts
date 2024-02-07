import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ArticlesSort } from 'src/article/dto/get-all-articles.dto';

export class GetTagsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  per_page?: number;

  @IsOptional()
  @IsEnum(ArticlesSort)
  sort_by?: ArticlesSort;

  @IsOptional()
  @IsString()
  page?: number;
}
