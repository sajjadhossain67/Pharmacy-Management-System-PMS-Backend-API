import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly tokenRepo: Repository<RefreshTokenEntity>,
  ) {}

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase().trim(), isDeleted: false },
    });
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id, isDeleted: false } });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepo.update(userId, { lastLoginAt: new Date() });
  }

  async updatePasswordResetToken(
    userId: string,
    token: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    await this.userRepo.update(userId, {
      passwordResetToken: token ?? undefined,
      passwordResetExpiresAt: expiresAt ?? undefined,
    });
  }

  async findUserByPasswordResetToken(token: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: {
        passwordResetToken: token,
        isDeleted: false,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userRepo.update(userId, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpiresAt: undefined,
    });
  }

  // ─── Refresh Tokens ───────────────────────────────────────────

  async saveRefreshToken(data: Partial<RefreshTokenEntity>): Promise<RefreshTokenEntity> {
    const token = this.tokenRepo.create(data);
    return this.tokenRepo.save(token);
  }

  async findRefreshToken(token: string): Promise<RefreshTokenEntity | null> {
    return this.tokenRepo.findOne({
      where: { token, isRevoked: false, isDeleted: false },
      relations: { user: true },
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.tokenRepo.update({ token }, { isRevoked: true });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.tokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async deleteExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.tokenRepo
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now })
      .execute();
  }
}
