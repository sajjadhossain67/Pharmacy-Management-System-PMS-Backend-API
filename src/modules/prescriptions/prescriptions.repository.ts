import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrescriptionEntity, PrescriptionItemEntity } from './entities/prescription.entity';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { CustomQueryBuilder } from '../../common/custom-queries/query.builder';
import { PaginatedResult } from '../../common/interceptors/response.interceptor';

@Injectable()
export class PrescriptionsRepository {
  constructor(
    @InjectRepository(PrescriptionEntity)
    private readonly repo: Repository<PrescriptionEntity>,
    @InjectRepository(PrescriptionItemEntity)
    private readonly itemRepo: Repository<PrescriptionItemEntity>,
  ) {}

  async create(data: Partial<PrescriptionEntity>): Promise<PrescriptionEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<PrescriptionEntity | null> {
    return this.repo.findOne({
      where: { id, isDeleted: false },
      relations: { customer: true, items: true },
    });
  }

  async findAll(filter: QueryFilterDto): Promise<PaginatedResult<PrescriptionEntity>> {
    const qb = this.repo
      .createQueryBuilder('rx')
      .leftJoinAndSelect('rx.customer', 'customer')
      .leftJoinAndSelect('rx.items', 'items')
      .where('rx.is_deleted = false');
    CustomQueryBuilder.applyFilters(qb, filter, 'rx', ['prescriptionNumber', 'doctorName']);
    return CustomQueryBuilder.paginate(qb, filter);
  }

  async update(id: string, data: Partial<PrescriptionEntity>): Promise<PrescriptionEntity | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.update(id, { isDeleted: true } as any);
    await this.repo.softDelete(id);
  }

  async generatePrescriptionNumber(): Promise<string> {
    const count = await this.repo.count();
    const date = new Date();
    return `RX-${date.getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }
}
