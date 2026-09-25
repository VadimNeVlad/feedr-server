import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { getJwtSecret } from './jwt-secrets';

export const getJwtConfig = async (
  configService: ConfigService,
): Promise<JwtModuleOptions> => ({
  secret: getJwtSecret(configService, 'access'),
  signOptions: {
    issuer: 'feeds-backend',
    audience: 'feeds-api',
  },
});
