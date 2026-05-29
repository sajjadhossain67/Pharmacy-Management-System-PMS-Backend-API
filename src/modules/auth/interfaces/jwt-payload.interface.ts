import { UserRole } from '../../../common/enums';

export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload extends JwtPayload {
  tokenId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
