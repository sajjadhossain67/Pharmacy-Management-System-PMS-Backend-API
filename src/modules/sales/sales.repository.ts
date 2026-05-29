import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity, SaleItemEntity } from './entities/sale.entity';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { CustomQueryBuilder } from '../../common/custom-queries/query.builder';
import { PaginatedResult } from '../../common/interceptors/response.interceptor';

@Injectable()
export class SalesRepository {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly saleRepo: Repository<SaleEntity>,
    @InjectRepository(SaleItemEntity)
    private readonly itemRepo: Repository<SaleItemEntity>,
  ) {}

  async create(data: Partial<SaleEntity>): Promise<SaleEntity> {
    const entity = this.saleRepo.create(data);
    return this.saleRepo.save(entity);
  }

  async findById(id: string): Promise<SaleEntity | null> {
    return this.saleRepo.findOne({
      where: { id, isDeleted: false },
      relations: { customer: true, items: true },
    });
  }

  async findAll(filter: QueryFilterDto): Promise<PaginatedResult<SaleEntity>> {
    const qb = this.saleRepo
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .where('sale.is_deleted = false');
    CustomQueryBuilder.applyFilters(qb, filter, 'sale', ['invoiceNumber']);
    return CustomQueryBuilder.paginate(qb, filter);
  }

  async update(id: string, data: Partial<SaleEntity>): Promise<SaleEntity | null> {
    await this.saleRepo.update(id, data as any);
    return this.findById(id);
  }

  async updateItem(itemId: string, data: Partial<SaleItemEntity>): Promise<void> {
    await this.itemRepo.update(itemId, data as any);
  }

  async generateInvoiceNumber(): Promise<string> {
    const count = await this.saleRepo.count();
    const date = new Date();
    const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }

  async getDailySales(date: Date): Promise<{ total: number; count: number }> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const result = await this.saleRepo
      .createQueryBuilder('sale')
      .select('SUM(sale.total_amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('sale.sale_date BETWEEN :start AND :end', { start, end })
      .andWhere('sale.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('sale.is_deleted = false')
      .getRawOne<{ total: string; count: string }>();

    return {
      total: parseFloat(result?.total || '0'),
      count: parseInt(result?.count || '0'),
    };
  }

  async getRevenueBetween(startDate: Date, endDate: Date) {
    return this.saleRepo
      .createQueryBuilder('sale')
      .select('DATE(sale.sale_date)', 'date')
      .addSelect('SUM(sale.total_amount)', 'revenue')
      .addSelect('COUNT(*)', 'transactions')
      .where('sale.sale_date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere("sale.status != 'cancelled'")
      .andWhere('sale.is_deleted = false')
      .groupBy('DATE(sale.sale_date)')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async getTopSellingMedicines(limit = 10) {
    return this.itemRepo
      .createQueryBuilder('item')
      .select('item.medicine_id', 'medicineId')
      .addSelect('item.medicine_name', 'medicineName')
      .addSelect('SUM(item.quantity)', 'totalSold')
      .addSelect('SUM(item.total_price)', 'totalRevenue')
      .innerJoin('item.sale', 'sale')
      .where("sale.status != 'cancelled'")
      .andWhere('sale.is_deleted = false')
      .groupBy('item.medicine_id')
      .addGroupBy('item.medicine_name')
      .orderBy('totalSold', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getRevenueTrend(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.max(days - 1, 0));

    const rows = await this.saleRepo
      .createQueryBuilder('sale')
      .select('DATE(sale.sale_date)', 'date')
      .addSelect('SUM(sale.total_amount)', 'revenue')
      .addSelect('COUNT(*)', 'transactions')
      .where('sale.sale_date >= :startDate', { startDate })
      .andWhere('sale.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('sale.is_deleted = false')
      .groupBy('DATE(sale.sale_date)')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; revenue: string; transactions: string }>();

    return rows.map((row) => ({
      date: row.date,
      revenue: parseFloat(row.revenue || '0'),
      transactions: parseInt(row.transactions || '0'),
    }));
  }
}
