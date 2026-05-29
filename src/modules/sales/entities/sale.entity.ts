import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CustomerEntity } from '../../customers/entities/customer.entity';
import { SaleStatus, PaymentMethod, PaymentStatus } from '../../../common/enums';

@Entity('sales')
export class SaleEntity extends BaseEntity {
  @Column({ name: 'invoice_number', unique: true, length: 50 })
  invoiceNumber: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId?: string;

  @ManyToOne(() => CustomerEntity, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: CustomerEntity;

  @Column({ name: 'prescription_id', nullable: true })
  prescriptionId?: string;

  @Column({ name: 'sale_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  saleDate: Date;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  @Column({ name: 'subtotal', type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 12, scale: 2 })
  paidAmount: number;

  @Column({ name: 'change_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  changeAmount: number;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.PAID })
  paymentStatus: PaymentStatus;

  @Column({ name: 'cashier_id', nullable: true })
  cashierId?: string;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ name: 'refund_reason', type: 'text', nullable: true })
  refundReason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'loyalty_points_earned', type: 'int', default: 0 })
  loyaltyPointsEarned: number;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;

  @OneToMany(() => SaleItemEntity, (item) => item.sale, {
    cascade: true,
    eager: false,
  })
  items: SaleItemEntity[];
}

@Entity('sale_items')
export class SaleItemEntity extends BaseEntity {
  @Column({ name: 'sale_id' })
  saleId: string;

  @ManyToOne(() => SaleEntity, (sale) => sale.items)
  @JoinColumn({ name: 'sale_id' })
  sale: SaleEntity;

  @Column({ name: 'medicine_id' })
  medicineId: string;

  @Column({ name: 'medicine_name', length: 255 })
  medicineName: string;

  @Column({ name: 'medicine_sku', length: 100, nullable: true })
  medicineSku?: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'tax_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxPercent: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @Column({ name: 'batch_number', nullable: true })
  batchNumber?: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ name: 'returned_quantity', type: 'int', default: 0 })
  returnedQuantity: number;
}
