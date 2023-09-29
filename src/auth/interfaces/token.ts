export interface Token {
  id: string;
  email: string;
  iat: Date;
  exp: Date;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}
