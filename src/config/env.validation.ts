interface Environment {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  PORT?: string;
  CORS_ORIGINS?: string;
  TRUST_PROXY?: string;
  [key: string]: unknown;
}

export function validateEnvironment(config: Environment): Environment {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ] as const;
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  if (config.JWT_SECRET!.length < 16) {
    throw new Error('JWT_SECRET must contain at least 16 characters');
  }

  if (config.PORT && !/^\d+$/.test(config.PORT)) {
    throw new Error('PORT must be a number');
  }

  // A hop count only: `true` would trust any client-supplied X-Forwarded-For.
  if (config.TRUST_PROXY && !/^\d+$/.test(config.TRUST_PROXY)) {
    throw new Error(
      'TRUST_PROXY must be the number of reverse proxies in front of the app',
    );
  }

  const invalidOrigins = (config.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin && !isOrigin(origin));
  if (invalidOrigins.length > 0) {
    throw new Error(
      `CORS_ORIGINS must be comma-separated origins like https://example.com, got: ${invalidOrigins.join(', ')}`,
    );
  }

  return config;
}

function isOrigin(value: string): boolean {
  try {
    return new URL(value).origin === value;
  } catch {
    return false;
  }
}
