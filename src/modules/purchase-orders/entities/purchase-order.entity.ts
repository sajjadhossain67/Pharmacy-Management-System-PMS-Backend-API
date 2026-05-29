import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SupplierEntity } from '../../suppliers/entities/supplier.entity';
import { PurchaseOrderStatus } from '../../../common/enums';

@Entity('purchase_orders')
export class PurchaseOrderEntity extends BaseEntity {
  @Column({ name: 'order_number', unique: true, length: 50 })
  orderNumber: string;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => SupplierEntity)
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity;

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.DRAFT })
  status: PurchaseOrderStatus;

  @Column({ name: 'order_date', type: 'date' })
  orderDate: Date;

  @Column({ name: 'expected_delivery_date', type: 'date', nullable: true })
  expectedDeliveryDate?: Date;

  @Column({ name: 'received_date', type: 'date', nullable: true })
  receivedDate?: Date;

  @Column({ name: 'subtotal', type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_by_id', nullable: true })
  createdById?: string;

  @OneToMany(() => PurchaseOrderItemEntity, (item) => item.purchaseOrder, {
    cascade: true,
    eager: false,
  })
  items: PurchaseOrderItemEntity[];

  get balanceDue(): number {
    return Number(this.totalAmount) - Number(this.paidAmount);
  }
}

@Entity('purchase_order_items')
export class PurchaseOrderItemEntity extends BaseEntity {
  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrderEntity, (po) => po.items)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrderEntity;

  @Column({ name: 'medicine_id' })
  medicineId: string;

  @Column({ name: 'medicine_name', length: 255 })
  medicineName: string;

  @Column({ name: 'ordered_quantity', type: 'int' })
  orderedQuantity: number;

  @Column({ name: 'received_quantity', type: 'int', default: 0 })
  receivedQuantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ name: 'tax_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxPercent: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @Column({ name: 'batch_number', nullable: true })
  batchNumber?: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: Date;
}
