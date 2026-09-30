export function createPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    follow: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };
}

export const cloudinaryMock = {
  uploadImage: jest.fn(),
  deleteImageByUrl: jest.fn(),
};

export const jwtMock = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

export const configMock = {
  get: jest.fn((key: string) =>
    key === 'JWT_SECRET' ? 'a'.repeat(32) : undefined,
  ),
};
