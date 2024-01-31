import { IsOptional, IsString } from 'class-validator';

export class GetFollowsDto {
  @IsOptional()
  @IsString()
  per_page?: number;
}
