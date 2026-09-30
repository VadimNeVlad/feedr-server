import { Prisma } from '@prisma/client';
export const articleInclude = (viewerId?: string) =>
  ({
    author: {
      select: { id: true, name: true, bio: true, image: true, createdAt: true },
    },
    tagList: true,
    favorited: { where: { id: viewerId || '' }, select: { id: true } },
    _count: { select: { comments: true, favorited: true } },
  }) satisfies Prisma.ArticleInclude;
export function presentArticle<T extends { favorited: { id: string }[] }>(
  article: T,
) {
  const { favorited, ...publicArticle } = article;
  return { ...publicArticle, isFavorited: favorited.length > 0 };
}
type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: ReturnType<typeof articleInclude>;
}>;
export type ArticleResponse = ReturnType<
  typeof presentArticle<ArticleWithRelations>
>;
export const articleOrder = (
  sort?: string,
): Prisma.ArticleOrderByWithRelationInput[] =>
  sort === 'top'
    ? [{ favorited: { _count: 'desc' } }, { id: 'asc' }]
    : [{ createdAt: sort === 'oldest' ? 'asc' : 'desc' }, { id: 'asc' }];
