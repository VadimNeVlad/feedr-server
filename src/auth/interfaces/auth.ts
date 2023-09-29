import { User } from '@prisma/client';
import { Tokens } from './token';

export interface AuthResponse extends Tokens {
  user: User;
}
