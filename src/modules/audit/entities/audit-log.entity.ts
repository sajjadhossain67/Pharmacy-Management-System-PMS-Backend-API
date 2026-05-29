import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AuditAction } from '../../../common/enums';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['userId'])
@Index(['createdAt'])
export class AuditLogEntity extends BaseEntity {
  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'user_email', nullable: true })
  userEmail?: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'entity_type', length: 100 })
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId?: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues?: Record<string, unknown>;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues?: Record<string, unknown>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ name: 'endpoint', nullable: true })
  endpoint?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_sensitive', default: false })
  isSensitive: boolean;
}
