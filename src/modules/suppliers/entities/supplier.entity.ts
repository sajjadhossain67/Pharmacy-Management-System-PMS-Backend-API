import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SupplierStatus } from '../../../common/enums';

@Entity('suppliers')
@Index(['email'], { unique: true, where: 'email IS NOT NULL' })
export class SupplierEntity extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ name: 'company_name', length: 255, nullable: true })
  companyName?: string;

  @Column({ length: 100, nullable: true, unique: true })
  email?: string;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ name: 'alternate_phone', length: 20, nullable: true })
  alternatePhone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ length: 100, nullable: true })
  city?: string;

  @Column({ length: 100, nullable: true })
  country?: string;

  @Column({ name: 'tax_id', length: 100, nullable: true })
  taxId?: string;

  @Column({ name: 'license_number', length: 100, nullable: true })
  licenseNumber?: string;

  @Column({ name: 'payment_terms', type: 'int', default: 30 })
  paymentTermsDays: number;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 12, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ type: 'enum', enum: SupplierStatus, default: SupplierStatus.ACTIVE })
  status: SupplierStatus;

  @Column({ name: 'rating', type: 'decimal', precision: 3, scale: 1, default: 5.0 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'bank_name', length: 255, nullable: true })
  bankName?: string;

  @Column({ name: 'bank_account_number', length: 100, nullable: true })
  bankAccountNumber?: string;
}
