import { Prisma } from '@prisma/client';
import { privateUserSelect } from '../user/user.select';

export const authUserSelect = {
  ...privateUserSelect,
  _count: {
    select: {
      articles: true,
      favorites: true,
      followers: true,
      following: true,
      comments: true,
    },
  },
} satisfies Prisma.UserSelect;
