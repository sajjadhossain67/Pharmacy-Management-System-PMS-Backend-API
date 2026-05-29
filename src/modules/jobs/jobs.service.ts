import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryRepository } from '../inventory/inventory.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { RefreshTokenEntity } from '../auth/entities/refresh-token.entity';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly inventoryRepo: InventoryRepository,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
  ) {}

  // Run daily at 08:00
  @Cron('0 8 * * *', { name: 'daily-expiry-check' })
  async checkExpiringMedicines(): Promise<void> {
    this.logger.log('Running daily expiry check...');

    const expiringIn30 = await this.inventoryRepo.getExpiringMedicines(30);
    for (const medicine of expiringIn30) {
      if (!medicine.expiryDate) continue;
      const daysUntilExpiry = Math.ceil(
        (new Date(medicine.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      await this.notificationsService['createNotification']({
        type: 'EXPIRY_ALERT' as any,
        priority: daysUntilExpiry <= 7 ? 'CRITICAL' as any : 'HIGH' as any,
        title: 'Medicine Expiry Alert',
        message: `${medicine.name} expires in ${daysUntilExpiry} days`,
        referenceId: medicine.id,
        referenceType: 'medicine',
        metadata: { medicineId: medicine.id, daysUntilExpiry },
      });
    }

    this.logger.log(`Expiry check complete. ${expiringIn30.length} medicines expiring within 30 days.`);
  }

  // Run every hour
  @Cron(CronExpression.EVERY_HOUR, { name: 'low-stock-check' })
  async checkLowStockMedicines(): Promise<void> {
    this.logger.log('Running low-stock check...');
    const lowStock = await this.inventoryRepo.getLowStockMedicines();

    for (const medicine of lowStock) {
      await this.notificationsService['createNotification']({
        type: 'LOW_STOCK' as any,
        priority: 'HIGH' as any,
        title: 'Low Stock Alert',
        message: `${medicine.name} has only ${medicine.stockQuantity} units remaining (min: ${medicine.minimumStock})`,
        referenceId: medicine.id,
        referenceType: 'medicine',
        metadata: { medicineId: medicine.id, currentStock: medicine.stockQuantity },
      });
    }

    this.logger.log(`Low stock check complete. ${lowStock.length} medicines below minimum.`);
  }

  // Run weekly on Monday midnight
  @Cron('0 0 * * 1', { name: 'weekly-cleanup' })
  async weeklyCleanup(): Promise<void> {
    this.logger.log('Running weekly cleanup...');

    const notificationCutoff = new Date();
    notificationCutoff.setDate(notificationCutoff.getDate() - 90);

    const tokenCutoff = new Date();
    tokenCutoff.setDate(tokenCutoff.getDate() - 30);

    const [notificationCleanup, tokenCleanup] = await Promise.all([
      this.notificationRepo
        .createQueryBuilder()
        .delete()
        .from(NotificationEntity)
        .where('is_read = true')
        .andWhere('read_at IS NOT NULL')
        .andWhere('read_at < :notificationCutoff', { notificationCutoff })
        .execute(),
      this.refreshTokenRepo
        .createQueryBuilder()
        .delete()
        .from(RefreshTokenEntity)
        .where('expires_at < :now', { now: new Date() })
        .orWhere('(is_revoked = true AND updated_at < :tokenCutoff)', { tokenCutoff })
        .execute(),
    ]);

    this.logger.log(
      `Weekly cleanup complete. Removed ${(notificationCleanup.affected ?? 0)} notifications and ${(tokenCleanup.affected ?? 0)} refresh tokens.`,
    );
  }
}
