import { IsOptional, IsString } from 'class-validator';

export class GetTagsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  per_page?: number;
}
