interface Environment {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  PORT?: string;
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

  return config;
}
