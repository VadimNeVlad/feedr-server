export interface Token {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  jti: string;
  iat: number;
  exp: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}
