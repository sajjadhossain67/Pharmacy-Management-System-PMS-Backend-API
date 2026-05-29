import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryRepository } from './inventory.repository';
import { CreateMedicineDto, UpdateMedicineDto, AdjustStockDto } from './dto/medicine.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { StockMovementType, StockMovementDirection } from '../../common/enums';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  InsufficientStockException,
} from '../../common/exceptions/app.exception';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepo: InventoryRepository,
    private readonly events: EventEmitter2,
  ) {}

  // ─── Medicines ────────────────────────────────────────────────

  async createMedicine(dto: CreateMedicineDto, createdBy: string) {
    const skuExists = await this.inventoryRepo.medicineExistsBySku(dto.sku);
    if (skuExists) throw new DuplicateResourceException('Medicine', 'SKU');

    const medicine = await this.inventoryRepo.createMedicine({
      ...dto,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      createdBy,
    });

    this.events.emit('medicine.created', { medicine, createdBy });
    return medicine;
  }

  async findAllMedicines(filter: QueryFilterDto) {
    return this.inventoryRepo.findAllMedicines(filter);
  }

  async findMedicine(id: string) {
    const medicine = await this.inventoryRepo.findMedicineById(id);
    if (!medicine) throw new ResourceNotFoundException('Medicine', id);
    return medicine;
  }

  async findByBarcode(barcode: string) {
    const medicine = await this.inventoryRepo.findMedicineByBarcode(barcode);
    if (!medicine) throw new ResourceNotFoundException('Medicine');
    return medicine;
  }

  async updateMedicine(id: string, dto: UpdateMedicineDto, updatedBy: string) {
    const medicine = await this.inventoryRepo.findMedicineById(id);
    if (!medicine) throw new ResourceNotFoundException('Medicine', id);

    if (dto.sku && dto.sku !== medicine.sku) {
      const exists = await this.inventoryRepo.medicineExistsBySku(dto.sku, id);
      if (exists) throw new DuplicateResourceException('Medicine', 'SKU');
    }

    return this.inventoryRepo.updateMedicine(id, { ...dto, expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined, updatedBy });
  }

  async removeMedicine(id: string, deletedBy: string) {
    const medicine = await this.inventoryRepo.findMedicineById(id);
    if (!medicine) throw new ResourceNotFoundException('Medicine', id);
    await this.inventoryRepo.softDeleteMedicine(id, deletedBy);
    return { message: 'Medicine deleted successfully' };
  }

  async adjustStock(id: string, dto: AdjustStockDto, performedBy: string) {
    const medicine = await this.inventoryRepo.findMedicineById(id);
    if (!medicine) throw new ResourceNotFoundException('Medicine', id);

    const beforeQty = medicine.stockQuantity;
    const afterQty = beforeQty + dto.quantity;

    if (afterQty < 0) {
      throw new InsufficientStockException(medicine.name, beforeQty, Math.abs(dto.quantity));
    }

    await this.inventoryRepo.updateStock(id, afterQty);

    await this.inventoryRepo.recordMovement({
      medicineId: id,
      type: StockMovementType.ADJUSTMENT,
      direction: dto.quantity > 0 ? StockMovementDirection.IN : StockMovementDirection.OUT,
      quantity: Math.abs(dto.quantity),
      beforeQuantity: beforeQty,
      afterQuantity: afterQty,
      batchNumber: dto.batchNumber,
      notes: dto.notes,
      performedBy,
    });

    if (afterQty <= medicine.minimumStock) {
      this.events.emit('stock.low', { medicine, currentStock: afterQty });
    }

    return this.inventoryRepo.findMedicineById(id);
  }

  async getLowStockMedicines() {
    return this.inventoryRepo.getLowStockMedicines();
  }

  async getExpiringMedicines(withinDays = 30) {
    return this.inventoryRepo.getExpiringMedicines(withinDays);
  }

  async getStockMovements(medicineId: string, filter: QueryFilterDto) {
    await this.findMedicine(medicineId);
    return this.inventoryRepo.findMovementsByMedicine(medicineId, filter);
  }

  async getInventoryValue() {
    return { totalValue: await this.inventoryRepo.getInventoryValue() };
  }

  // ─── Categories ───────────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto, createdBy: string) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    return this.inventoryRepo.createCategory({ ...dto, slug, createdBy });
  }

  async findAllCategories() {
    return this.inventoryRepo.findAllCategories();
  }

  async findCategory(id: string) {
    const cat = await this.inventoryRepo.findCategoryById(id);
    if (!cat) throw new ResourceNotFoundException('Category', id);
    return cat;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, updatedBy: string) {
    await this.findCategory(id);
    const updates: any = { ...dto, updatedBy };
    if (dto.name) updates.slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    return this.inventoryRepo.updateCategory(id, updates);
  }

  async removeCategory(id: string) {
    await this.findCategory(id);
    await this.inventoryRepo.softDeleteCategory(id);
    return { message: 'Category deleted successfully' };
  }
}
