import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { MedicineEntity } from './entities/medicine.entity';
import { CategoryEntity } from './entities/category.entity';
import { StockMovementEntity } from './entities/stock-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicineEntity, CategoryEntity, StockMovementEntity]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService, InventoryRepository],
})
export class InventoryModule {}
