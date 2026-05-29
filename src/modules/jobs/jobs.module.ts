import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { RefreshTokenEntity } from '../auth/entities/refresh-token.entity';

@Module({
  imports: [
    InventoryModule,
    NotificationsModule,
    TypeOrmModule.forFeature([NotificationEntity, RefreshTokenEntity]),
  ],
  providers: [JobsService],
})
export class JobsModule {}
