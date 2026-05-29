import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { CustomQueryBuilder } from '../../common/custom-queries/query.builder';
import { PaginatedResult } from '../../common/interceptors/response.interceptor';
import { AuditAction } from '../../common/enums';
import { OnEvent } from '@nestjs/event-emitter';

export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  description?: string;
  isSensitive?: boolean;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async log(data: AuditLogData): Promise<AuditLogEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findAll(filter: QueryFilterDto): Promise<PaginatedResult<AuditLogEntity>> {
    const qb = this.repo
      .createQueryBuilder('audit')
      .where('audit.is_deleted = false');
    CustomQueryBuilder.applyFilters(qb, filter, 'audit', [
      'entityType', 'entityId', 'userId', 'userEmail', 'action',
    ]);
    return CustomQueryBuilder.paginate(qb, filter);
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.repo.find({
      where: { entityType, entityId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string, filter: QueryFilterDto) {
    const qb = this.repo
      .createQueryBuilder('audit')
      .where('audit.user_id = :userId', { userId })
      .andWhere('audit.is_deleted = false');
    CustomQueryBuilder.applyFilters(qb, filter, 'audit');
    return CustomQueryBuilder.paginate(qb, filter);
  }

  // ─── Event Listeners ──────────────────────────────────────────

  @OnEvent('user.created')
  async onUserCreated(payload: any) {
    await this.log({
      action: AuditAction.CREATE,
      entityType: 'user',
      entityId: payload.userId,
      userId: payload.createdBy,
      description: `User created by ${payload.createdBy}`,
    });
  }

  @OnEvent('medicine.created')
  async onMedicineCreated(payload: any) {
    await this.log({
      action: AuditAction.CREATE,
      entityType: 'medicine',
      entityId: payload.medicine.id,
      userId: payload.createdBy,
      description: `Medicine "${payload.medicine.name}" created`,
    });
  }

  @OnEvent('sale.completed')
  async onSaleCompleted(payload: any) {
    await this.log({
      action: AuditAction.CREATE,
      entityType: 'sale',
      entityId: payload.sale.id,
      userId: payload.cashierId,
      description: `Sale ${payload.sale.invoiceNumber} completed — Total: ${payload.sale.totalAmount}`,
    });
  }
}
