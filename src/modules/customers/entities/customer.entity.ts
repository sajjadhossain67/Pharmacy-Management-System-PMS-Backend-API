import { Entity, Column, Index, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CustomerStatus, Gender } from '../../../common/enums';

@Entity('customers')
@Index(['phone'], { unique: true, where: 'phone IS NOT NULL' })
export class CustomerEntity extends BaseEntity {
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName?: string;

  @Column({ length: 100, nullable: true })
  email?: string;

  @Column({ length: 20, nullable: true, unique: true })
  phone?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ length: 100, nullable: true })
  city?: string;

  @Column({ name: 'loyalty_points', type: 'int', default: 0 })
  loyaltyPoints: number;

  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: CustomerStatus;

  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @Column({ name: 'medical_history', type: 'text', nullable: true })
  medicalHistory?: string;

  @Column({ name: 'insurance_provider', length: 255, nullable: true })
  insuranceProvider?: string;

  @Column({ name: 'insurance_number', length: 100, nullable: true })
  insuranceNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  get fullName(): string {
    return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName;
  }
}
