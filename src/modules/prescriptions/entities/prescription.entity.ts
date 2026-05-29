import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CustomerEntity } from '../../customers/entities/customer.entity';
import { PrescriptionStatus } from '../../../common/enums';

@Entity('prescriptions')
export class PrescriptionEntity extends BaseEntity {
  @Column({ name: 'prescription_number', unique: true, length: 50 })
  prescriptionNumber: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId?: string;

  @ManyToOne(() => CustomerEntity, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: CustomerEntity;

  @Column({ name: 'doctor_name', length: 255, nullable: true })
  doctorName?: string;

  @Column({ name: 'doctor_license', length: 100, nullable: true })
  doctorLicense?: string;

  @Column({ name: 'hospital_name', length: 255, nullable: true })
  hospitalName?: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil?: Date;

  @Column({ type: 'enum', enum: PrescriptionStatus, default: PrescriptionStatus.PENDING })
  status: PrescriptionStatus;

  @Column({ name: 'prescription_image_url', nullable: true })
  prescriptionImageUrl?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy?: string;

  @OneToMany(() => PrescriptionItemEntity, (item) => item.prescription, {
    cascade: true,
    eager: false,
  })
  items: PrescriptionItemEntity[];
}

@Entity('prescription_items')
export class PrescriptionItemEntity extends BaseEntity {
  @Column({ name: 'prescription_id' })
  prescriptionId: string;

  @ManyToOne(() => PrescriptionEntity, (p) => p.items)
  @JoinColumn({ name: 'prescription_id' })
  prescription: PrescriptionEntity;

  @Column({ name: 'medicine_id', nullable: true })
  medicineId?: string;

  @Column({ name: 'medicine_name', length: 255 })
  medicineName: string;

  @Column({ length: 255, nullable: true })
  dosage?: string;

  @Column({ length: 255, nullable: true })
  frequency?: string;

  @Column({ name: 'duration_days', type: 'int', nullable: true })
  durationDays?: number;

  @Column({ type: 'int', nullable: true })
  quantity?: number;

  @Column({ type: 'text', nullable: true })
  instructions?: string;
}
