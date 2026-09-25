import { Prisma } from '@prisma/client';
import { Tokens } from './token';
import { authUserSelect } from '../auth.select';

export interface AuthResponse extends Tokens {
  user: Prisma.UserGetPayload<{ select: typeof authUserSelect }>;
}
