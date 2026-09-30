import { ArticleResponse } from '../article.select';

export interface ArticleData {
  articles: ArticleResponse[];
  _count: number;
}
