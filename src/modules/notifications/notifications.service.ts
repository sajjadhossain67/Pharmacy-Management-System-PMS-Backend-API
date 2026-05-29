import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationType, NotificationPriority } from '../../common/enums';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { CustomQueryBuilder } from '../../common/custom-queries/query.builder';
import { OnEvent } from '@nestjs/event-emitter';
import { MedicineEntity } from '../inventory/entities/medicine.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async createNotification(data: Partial<NotificationEntity>): Promise<NotificationEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findForUser(userId: string, filter: QueryFilterDto) {
    const qb = this.repo
      .createQueryBuilder('n')
      .where('(n.user_id = :userId OR n.user_id IS NULL)', { userId })
      .andWhere('n.is_deleted = false');
    CustomQueryBuilder.applyFilters(qb, filter, 'n');
    return CustomQueryBuilder.paginate(qb, filter);
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.repo.update(id, { isRead: true, readAt: new Date() });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ isRead: true, readAt: new Date() })
      .where('user_id = :userId AND is_read = false', { userId })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({
      where: { userId, isRead: false, isDeleted: false },
    });
  }

  // ─── Event Listeners ──────────────────────────────────────────

  @OnEvent('stock.low')
  async handleLowStockEvent(payload: { medicine: MedicineEntity }) {
    const { medicine } = payload;
    await this.createNotification({
      type: NotificationType.LOW_STOCK,
      priority: NotificationPriority.HIGH,
      title: 'Low Stock Alert',
      message: `${medicine.name} stock is low (${medicine.stockQuantity} ${medicine.unit} remaining). Minimum: ${medicine.minimumStock}`,
      referenceId: medicine.id,
      referenceType: 'medicine',
      metadata: { medicineId: medicine.id, currentStock: medicine.stockQuantity },
    });
  }

  @OnEvent('medicine.expiry.alert')
  async handleExpiryAlert(payload: { medicine: MedicineEntity; daysUntilExpiry: number }) {
    const { medicine, daysUntilExpiry } = payload;
    await this.createNotification({
      type: NotificationType.EXPIRY_ALERT,
      priority: daysUntilExpiry <= 7 ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
      title: 'Medicine Expiry Alert',
      message: `${medicine.name} (Batch: ${medicine.batchNumber || 'N/A'}) expires in ${daysUntilExpiry} days on ${medicine.expiryDate}`,
      referenceId: medicine.id,
      referenceType: 'medicine',
      metadata: { medicineId: medicine.id, expiryDate: medicine.expiryDate, daysUntilExpiry },
    });
  }

  @OnEvent('sale.completed')
  async handleSaleCompleted(payload: { sale: any }) {
    await this.createNotification({
      type: NotificationType.SALE,
      priority: NotificationPriority.LOW,
      title: 'Sale Completed',
      message: `Invoice ${payload.sale.invoiceNumber} — Total: ${payload.sale.totalAmount}`,
      referenceId: payload.sale.id,
      referenceType: 'sale',
    });
  }
}
