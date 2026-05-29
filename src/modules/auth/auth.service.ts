import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthRepository } from './auth.repository';
import { UsersRepository } from '../users/users.repository';
import { JwtPayload, AuthTokens } from './interfaces/jwt-payload.interface';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import {
  InvalidCredentialsException,
  TokenExpiredException,
  ResourceNotFoundException,
  InvalidOperationException,
} from '../../common/exceptions/app.exception';
import { comparePassword, hashPassword } from '../../common/utils/hash.util';
import { UserStatus } from '../../common/enums';

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly usersRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Login ────────────────────────────────────────────────────
  async login(dto: LoginDto, req: Request): Promise<AuthTokens> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    if (!user) throw new InvalidCredentialsException();

    if (user.status !== UserStatus.ACTIVE) {
      throw new InvalidOperationException(
        `Account is ${user.status}. Please contact administrator.`,
      );
    }

    const valid = await comparePassword(dto.password, user.password);
    if (!valid) throw new InvalidCredentialsException();

    await this.authRepo.updateLastLogin(user.id);

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Persist refresh token
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn', '7d');
    const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expiresAt = addDays(new Date(), parseInt(refreshExpiresIn as string) || 7);

    await this.authRepo.saveRefreshToken({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return tokens;
  }

  // ─── Refresh Token ────────────────────────────────────────────
  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    const stored = await this.authRepo.findRefreshToken(dto.refreshToken);
    if (!stored || !stored.isValid) throw new TokenExpiredException();

    // Revoke old refresh token (rotation)
    await this.authRepo.revokeRefreshToken(dto.refreshToken);

    const user = stored.user;
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn', '7d');
    const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expiresAt = addDays(new Date(), parseInt(refreshExpiresIn as string) || 7);

    await this.authRepo.saveRefreshToken({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt,
    });

    return tokens;
  }

  // ─── Logout ───────────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.authRepo.revokeRefreshToken(refreshToken);
    } else {
      await this.authRepo.revokeAllUserRefreshTokens(userId);
    }
  }

  // ─── Change Password ──────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.authRepo.findUserById(userId);
    if (!user) throw new ResourceNotFoundException('User', userId);

    const valid = await comparePassword(dto.currentPassword, user.password);
    if (!valid)
      throw new InvalidCredentialsException();

    const hashed = await hashPassword(dto.newPassword);
    await this.authRepo.updatePassword(userId, hashed);
    await this.authRepo.revokeAllUserRefreshTokens(userId);
  }

  // ─── Get Profile ──────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.authRepo.findUserById(userId);
    if (!user) throw new ResourceNotFoundException('User', userId);
    return user;
  }

  // ─── Token Generation ─────────────────────────────────────────
  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const jwtCfg = this.config.get('jwt');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtCfg.secret,
        expiresIn: jwtCfg.expiresIn,
      }),
      this.jwtService.signAsync(
        { ...payload, tokenId: uuidv4() },
        {
          secret: jwtCfg.refreshSecret,
          expiresIn: jwtCfg.refreshExpiresIn,
        },
      ),
    ]);

    // Parse expiresIn to seconds
    const expiresIn = this.parseExpiresIn(jwtCfg.expiresIn);

    return { accessToken, refreshToken, expiresIn };
  }

  private parseExpiresIn(expiresIn: string): number {
    const num = parseInt(expiresIn);
    if (expiresIn.endsWith('m')) return num * 60;
    if (expiresIn.endsWith('h')) return num * 3600;
    if (expiresIn.endsWith('d')) return num * 86400;
    return num;
  }
}
