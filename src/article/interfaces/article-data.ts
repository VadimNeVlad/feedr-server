import { Article } from '@prisma/client';

export interface ArticleData {
  articles: Article[];
  _count: number;
}
