import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, LessThan } from 'typeorm';
import { MedicineEntity } from './entities/medicine.entity';
import { CategoryEntity } from './entities/category.entity';
import { StockMovementEntity } from './entities/stock-movement.entity';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { CustomQueryBuilder } from '../../common/custom-queries/query.builder';
import { PaginatedResult } from '../../common/interceptors/response.interceptor';
import { StockMovementType, StockMovementDirection } from '../../common/enums';
import { isExpiringWithinDays } from '../../common/utils/date.util';

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectRepository(MedicineEntity)
    private readonly medicineRepo: Repository<MedicineEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(StockMovementEntity)
    private readonly movementRepo: Repository<StockMovementEntity>,
  ) {}

  // ─── Medicines ────────────────────────────────────────────────

  async createMedicine(data: Partial<MedicineEntity>): Promise<MedicineEntity> {
    const entity = this.medicineRepo.create(data);
    return this.medicineRepo.save(entity);
  }

  async findMedicineById(id: string): Promise<MedicineEntity | null> {
    return this.medicineRepo.findOne({
      where: { id, isDeleted: false },
      relations: { category: true },
    });
  }

  async findMedicineBySku(sku: string): Promise<MedicineEntity | null> {
    return this.medicineRepo.findOne({ where: { sku, isDeleted: false } });
  }

  async findMedicineByBarcode(barcode: string): Promise<MedicineEntity | null> {
    return this.medicineRepo.findOne({ where: { barcode, isDeleted: false } });
  }

  async updateMedicine(id: string, data: Partial<MedicineEntity>): Promise<MedicineEntity | null> {
    await this.medicineRepo.update(id, data as any);
    return this.findMedicineById(id);
  }

  async softDeleteMedicine(id: string, deletedBy: string): Promise<void> {
    await this.medicineRepo.update(id, { isDeleted: true, updatedBy: deletedBy } as any);
    await this.medicineRepo.softDelete(id);
  }

  async findAllMedicines(filter: QueryFilterDto): Promise<PaginatedResult<MedicineEntity>> {
    const qb = this.medicineRepo
      .createQueryBuilder('medicine')
      .leftJoinAndSelect('medicine.category', 'category')
      .where('medicine.is_deleted = false');

    CustomQueryBuilder.applyFilters(qb, filter, 'medicine', [
      'name', 'genericName', 'sku', 'barcode', 'manufacturer', 'brand',
    ]);

    return CustomQueryBuilder.paginate(qb, filter);
  }

  async getLowStockMedicines(): Promise<MedicineEntity[]> {
    return this.medicineRepo
      .createQueryBuilder('medicine')
      .leftJoinAndSelect('medicine.category', 'category')
      .where('medicine.is_deleted = false')
      .andWhere('medicine.stock_quantity <= medicine.minimum_stock')
      .orderBy('medicine.stock_quantity', 'ASC')
      .getMany();
  }

  async getExpiringMedicines(withinDays: number = 30): Promise<MedicineEntity[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);

    return this.medicineRepo
      .createQueryBuilder('medicine')
      .where('medicine.is_deleted = false')
      .andWhere('medicine.expiry_date IS NOT NULL')
      .andWhere('medicine.expiry_date <= :futureDate', { futureDate })
      .andWhere('medicine.expiry_date >= :now', { now: new Date() })
      .orderBy('medicine.expiry_date', 'ASC')
      .getMany();
  }

  async updateStock(medicineId: string, newQuantity: number): Promise<void> {
    await this.medicineRepo.update(medicineId, { stockQuantity: newQuantity } as any);
  }

  async medicineExistsBySku(sku: string, excludeId?: string): Promise<boolean> {
    const qb = this.medicineRepo
      .createQueryBuilder('m')
      .where('m.sku = :sku', { sku })
      .andWhere('m.is_deleted = false');
    if (excludeId) qb.andWhere('m.id != :excludeId', { excludeId });
    return (await qb.getCount()) > 0;
  }

  async getInventoryValue(): Promise<number> {
    const result = await this.medicineRepo
      .createQueryBuilder('medicine')
      .select('SUM(medicine.stock_quantity * medicine.buying_price)', 'totalValue')
      .where('medicine.is_deleted = false')
      .getRawOne<{ totalValue: string }>();
    return parseFloat(result?.totalValue || '0');
  }

  // ─── Categories ───────────────────────────────────────────────

  async createCategory(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const entity = this.categoryRepo.create(data);
    return this.categoryRepo.save(entity);
  }

  async findAllCategories(): Promise<CategoryEntity[]> {
    return this.categoryRepo.find({
      where: { isDeleted: false, isActive: true },
      relations: { parent: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findCategoryById(id: string): Promise<CategoryEntity | null> {
    return this.categoryRepo.findOne({ where: { id, isDeleted: false }, relations: { parent: true } });
  }

  async updateCategory(id: string, data: Partial<CategoryEntity>): Promise<CategoryEntity | null> {
    await this.categoryRepo.update(id, data as any);
    return this.findCategoryById(id);
  }

  async softDeleteCategory(id: string): Promise<void> {
    await this.categoryRepo.update(id, { isDeleted: true } as any);
    await this.categoryRepo.softDelete(id);
  }

  // ─── Stock Movements ──────────────────────────────────────────

  async recordMovement(data: Partial<StockMovementEntity>): Promise<StockMovementEntity> {
    const entity = this.movementRepo.create(data);
    return this.movementRepo.save(entity);
  }

  async findMovementsByMedicine(
    medicineId: string,
    filter: QueryFilterDto,
  ): Promise<PaginatedResult<StockMovementEntity>> {
    const qb = this.movementRepo
      .createQueryBuilder('mov')
      .where('mov.medicine_id = :medicineId', { medicineId });

    CustomQueryBuilder.applyFilters(qb, filter, 'mov');
    return CustomQueryBuilder.paginate(qb, filter);
  }
}
