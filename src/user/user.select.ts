import { Prisma } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  name: true,
  bio: true,
  image: true,
  location: true,
  websiteUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const privateUserSelect = {
  ...publicUserSelect,
  email: true,
} satisfies Prisma.UserSelect;

export const publicUserProfileSelect = {
  ...publicUserSelect,
  _count: {
    select: {
      comments: true,
      articles: true,
      followers: true,
      following: true,
    },
  },
} satisfies Prisma.UserSelect;

export const privateUserProfileSelect = {
  ...publicUserProfileSelect,
  email: true,
} satisfies Prisma.UserSelect;

export type PublicUser = { isFollowing?: boolean } & Prisma.UserGetPayload<{
  select: typeof publicUserProfileSelect;
}>;

export type PrivateUser = Prisma.UserGetPayload<{
  select: typeof privateUserProfileSelect;
}>;
