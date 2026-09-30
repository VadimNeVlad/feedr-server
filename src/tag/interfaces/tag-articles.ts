import { ArticleResponse } from '../../article/article.select';

export interface TagArticles {
  articles: ArticleResponse[];
  _count: {
    articles: number;
  };
}
