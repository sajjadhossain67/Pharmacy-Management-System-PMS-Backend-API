import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { CustomQueryBuilder } from '../../common/custom-queries/query.builder';
import { PaginatedResult } from '../../common/interceptors/response.interceptor';

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repo: Repository<CustomerEntity>,
  ) {}

  async create(data: Partial<CustomerEntity>): Promise<CustomerEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<CustomerEntity | null> {
    return this.repo.findOne({ where: { id, isDeleted: false } });
  }

  async findByPhone(phone: string): Promise<CustomerEntity | null> {
    return this.repo.findOne({ where: { phone, isDeleted: false } });
  }

  async update(id: string, data: Partial<CustomerEntity>): Promise<CustomerEntity | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.repo.update(id, { isDeleted: true, updatedBy: deletedBy } as any);
    await this.repo.softDelete(id);
  }

  async findAll(filter: QueryFilterDto): Promise<PaginatedResult<CustomerEntity>> {
    const qb = this.repo
      .createQueryBuilder('customer')
      .where('customer.is_deleted = false');
    CustomQueryBuilder.applyFilters(qb, filter, 'customer', [
      'firstName', 'lastName', 'email', 'phone',
    ]);
    return CustomQueryBuilder.paginate(qb, filter);
  }

  async addLoyaltyPoints(id: string, points: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(CustomerEntity)
      .set({ loyaltyPoints: () => `loyalty_points + ${points}` })
      .where('id = :id', { id })
      .execute();
  }
}
