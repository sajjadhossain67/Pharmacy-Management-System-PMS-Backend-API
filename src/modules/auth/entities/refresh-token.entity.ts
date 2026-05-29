import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { Exclude } from 'class-transformer';

@Entity('refresh_tokens')
@Index(['token'], { unique: true })
@Index(['userId'])
export class RefreshTokenEntity extends BaseEntity {
  @Column({ unique: true, length: 500 })
  @Exclude()
  token: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true, length: 500 })
  userAgent?: string;

  get isExpired(): boolean {
    return new Date() > new Date(this.expiresAt);
  }

  get isValid(): boolean {
    return !this.isRevoked && !this.isExpired && !this.isDeleted;
  }
}
