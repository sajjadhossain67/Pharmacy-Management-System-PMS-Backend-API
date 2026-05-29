import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierEntity } from './entities/supplier.entity';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { CustomQueryBuilder } from '../../common/custom-queries/query.builder';
import { PaginatedResult } from '../../common/interceptors/response.interceptor';

@Injectable()
export class SuppliersRepository {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly repo: Repository<SupplierEntity>,
  ) {}

  async create(data: Partial<SupplierEntity>): Promise<SupplierEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<SupplierEntity | null> {
    return this.repo.findOne({ where: { id, isDeleted: false } });
  }

  async findByEmail(email: string): Promise<SupplierEntity | null> {
    return this.repo.findOne({ where: { email, isDeleted: false } });
  }

  async update(id: string, data: Partial<SupplierEntity>): Promise<SupplierEntity | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.repo.update(id, { isDeleted: true, updatedBy: deletedBy } as any);
    await this.repo.softDelete(id);
  }

  async findAll(filter: QueryFilterDto): Promise<PaginatedResult<SupplierEntity>> {
    const qb = this.repo
      .createQueryBuilder('supplier')
      .where('supplier.is_deleted = false');
    CustomQueryBuilder.applyFilters(qb, filter, 'supplier', [
      'name', 'companyName', 'email', 'phoneNumber', 'city',
    ]);
    return CustomQueryBuilder.paginate(qb, filter);
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.email = :email', { email })
      .andWhere('s.is_deleted = false');
    if (excludeId) qb.andWhere('s.id != :excludeId', { excludeId });
    return (await qb.getCount()) > 0;
  }
}
