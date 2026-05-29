import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  @Exclude()
  deletedAt?: Date;

  @Column({ name: 'is_deleted', default: false })
  @Exclude()
  isDeleted: boolean;

  @Column({ name: 'created_by', nullable: true })
  @Exclude()
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  @Exclude()
  updatedBy?: string;
}
