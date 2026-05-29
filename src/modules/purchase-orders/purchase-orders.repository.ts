import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderEntity, PurchaseOrderItemEntity } from './entities/purchase-order.entity';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { CustomQueryBuilder } from '../../common/custom-queries/query.builder';
import { PaginatedResult } from '../../common/interceptors/response.interceptor';

@Injectable()
export class PurchaseOrdersRepository {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly poRepo: Repository<PurchaseOrderEntity>,
    @InjectRepository(PurchaseOrderItemEntity)
    private readonly itemRepo: Repository<PurchaseOrderItemEntity>,
  ) {}

  async create(data: Partial<PurchaseOrderEntity>): Promise<PurchaseOrderEntity> {
    const entity = this.poRepo.create(data);
    return this.poRepo.save(entity);
  }

  async findById(id: string): Promise<PurchaseOrderEntity | null> {
    return this.poRepo.findOne({
      where: { id, isDeleted: false },
      relations: { supplier: true, items: true },
    });
  }

  async findAll(filter: QueryFilterDto): Promise<PaginatedResult<PurchaseOrderEntity>> {
    const qb = this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .where('po.is_deleted = false');
    CustomQueryBuilder.applyFilters(qb, filter, 'po', ['orderNumber']);
    return CustomQueryBuilder.paginate(qb, filter);
  }

  async update(id: string, data: Partial<PurchaseOrderEntity>): Promise<PurchaseOrderEntity | null> {
    await this.poRepo.update(id, data as any);
    return this.findById(id);
  }

  async updateItem(itemId: string, data: Partial<PurchaseOrderItemEntity>): Promise<void> {
    await this.itemRepo.update(itemId, data as any);
  }

  async softDelete(id: string): Promise<void> {
    await this.poRepo.update(id, { isDeleted: true } as any);
    await this.poRepo.softDelete(id);
  }

  async generateOrderNumber(): Promise<string> {
    const count = await this.poRepo.count();
    return `PO-${String(count + 1).padStart(6, '0')}`;
  }
}
