import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MedicineEntity } from './medicine.entity';
import { StockMovementType, StockMovementDirection } from '../../../common/enums';

@Entity('stock_movements')
export class StockMovementEntity extends BaseEntity {
  @Column({ name: 'medicine_id' })
  medicineId: string;

  @ManyToOne(() => MedicineEntity)
  @JoinColumn({ name: 'medicine_id' })
  medicine: MedicineEntity;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({ type: 'enum', enum: StockMovementDirection })
  direction: StockMovementDirection;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'before_quantity', type: 'int' })
  beforeQuantity: number;

  @Column({ name: 'after_quantity', type: 'int' })
  afterQuantity: number;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ name: 'reference_type', nullable: true })
  referenceType?: string;

  @Column({ name: 'batch_number', nullable: true })
  batchNumber?: string;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitCost?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'performed_by', nullable: true })
  performedBy?: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;
}
