import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const base = {
    DATABASE_URL: 'postgresql://localhost/feeds',
    JWT_SECRET: 'a'.repeat(32),
    CLOUD_NAME: 'cloud',
    CLOUDINARY_API_KEY: 'key',
    CLOUDINARY_API_SECRET: 'secret',
  };

  it('accepts comma-separated origins', () => {
    expect(() =>
      validateEnvironment({
        ...base,
        CORS_ORIGINS: 'https://feedr.app, http://localhost:5173',
      }),
    ).not.toThrow();
  });

  it('accepts a proxy hop count and rejects trusting every proxy', () => {
    expect(() =>
      validateEnvironment({ ...base, TRUST_PROXY: '1' }),
    ).not.toThrow();
    expect(() => validateEnvironment({ ...base, TRUST_PROXY: 'true' })).toThrow(
      'TRUST_PROXY',
    );
  });

  it('rejects origins with a path or trailing slash', () => {
    expect(() =>
      validateEnvironment({ ...base, CORS_ORIGINS: 'https://feedr.app/' }),
    ).toThrow('CORS_ORIGINS');
  });
});
