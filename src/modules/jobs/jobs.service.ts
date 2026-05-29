import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryRepository } from '../inventory/inventory.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { isExpiringWithinDays } from '../../common/utils/date.util';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly inventoryRepo: InventoryRepository,
    private readonly notificationsService: NotificationsService,
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
    // Placeholder for future cleanup tasks (old notifications, expired tokens, etc.)
    this.logger.log('Weekly cleanup complete.');
  }
}
