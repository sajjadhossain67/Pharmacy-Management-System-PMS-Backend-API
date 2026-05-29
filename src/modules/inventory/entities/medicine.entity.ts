import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CategoryEntity } from './category.entity';
import { MedicineStatus, MedicineType } from '../../../common/enums';

@Entity('medicines')
@Index(['sku'], { unique: true })
@Index(['barcode'], { unique: true })
export class MedicineEntity extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ name: 'generic_name', length: 255, nullable: true })
  genericName?: string;

  @Column({ name: 'sku', length: 100, unique: true })
  sku: string;

  @Column({ name: 'barcode', length: 100, unique: true, nullable: true })
  barcode?: string;

  @Column({ length: 255, nullable: true })
  manufacturer?: string;

  @Column({ length: 255, nullable: true })
  brand?: string;

  @Column({ type: 'enum', enum: MedicineType, default: MedicineType.TABLET })
  type: MedicineType;

  @Column({ type: 'enum', enum: MedicineStatus, default: MedicineStatus.ACTIVE })
  status: MedicineStatus;

  @Column({ name: 'buying_price', type: 'decimal', precision: 12, scale: 2 })
  buyingPrice: number;

  @Column({ name: 'selling_price', type: 'decimal', precision: 12, scale: 2 })
  sellingPrice: number;

  @Column({ name: 'mrp', type: 'decimal', precision: 12, scale: 2, nullable: true })
  mrp?: number;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ name: 'minimum_stock', type: 'int', default: 10 })
  minimumStock: number;

  @Column({ name: 'maximum_stock', type: 'int', nullable: true })
  maximumStock?: number;

  @Column({ name: 'reorder_point', type: 'int', default: 20 })
  reorderPoint: number;

  @Column({ name: 'unit', length: 50, default: 'pcs' })
  unit: string;

  @Column({ name: 'pack_size', type: 'int', default: 1 })
  packSize: number;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ name: 'batch_number', length: 100, nullable: true })
  batchNumber?: string;

  @Column({ name: 'storage_condition', length: 255, nullable: true })
  storageCondition?: string;

  @Column({ name: 'requires_prescription', default: false })
  requiresPrescription: boolean;

  @Column({ name: 'is_controlled', default: false })
  isControlled: boolean;

  @Column({ name: 'hsn_code', length: 50, nullable: true })
  hsnCode?: string;

  @Column({ name: 'tax_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxPercent: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'side_effects', type: 'text', nullable: true })
  sideEffects?: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: string;

  @ManyToOne(() => CategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryEntity;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId?: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;

  get isLowStock(): boolean {
    return this.stockQuantity <= this.minimumStock;
  }

  get isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > new Date(this.expiryDate);
  }

  get effectivePrice(): number {
    const discount = (Number(this.sellingPrice) * Number(this.discountPercent)) / 100;
    return Number(this.sellingPrice) - discount;
  }
}
