import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';

export type JwtTokenType = 'access' | 'refresh';

export function getJwtSecret(
  configService: ConfigService,
  type: JwtTokenType,
): string {
  const masterSecret = configService.get<string>('JWT_SECRET');

  if (!masterSecret) {
    throw new Error('JWT_SECRET is required');
  }

  return createHmac('sha256', masterSecret)
    .update(`feeds-backend:${type}`)
    .digest('base64');
}
