import { Article } from '@prisma/client';

export interface TagArticles {
  articles: Article[];
  _count: {
    articles: number;
  };
}
