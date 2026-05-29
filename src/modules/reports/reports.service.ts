import { Injectable } from '@nestjs/common';
import { SalesRepository } from '../sales/sales.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear } from '../../common/utils/date.util';

@Injectable()
export class ReportsService {
  constructor(
    private readonly salesRepo: SalesRepository,
    private readonly inventoryRepo: InventoryRepository,
  ) {}

  async getRevenueReport(period: 'daily' | 'monthly' | 'yearly', date?: Date) {
    const d = date || new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === 'daily') {
      startDate = startOfDay(d);
      endDate = endOfDay(d);
    } else if (period === 'monthly') {
      startDate = startOfMonth(d);
      endDate = endOfMonth(d);
    } else {
      startDate = startOfYear(d);
      endDate = endOfDay(d);
    }

    const data = await this.salesRepo.getRevenueBetween(startDate, endDate);
    const totalRevenue = data.reduce((sum: number, row: any) => sum + parseFloat(row.revenue || '0'), 0);
    const totalTransactions = data.reduce((sum: number, row: any) => sum + parseInt(row.transactions || '0'), 0);

    return {
      period,
      startDate,
      endDate,
      totalRevenue,
      totalTransactions,
      breakdown: data,
    };
  }

  async getInventoryReport() {
    const [totalValue, lowStock, expiring] = await Promise.all([
      this.inventoryRepo.getInventoryValue(),
      this.inventoryRepo.getLowStockMedicines(),
      this.inventoryRepo.getExpiringMedicines(30),
    ]);

    return {
      totalInventoryValue: totalValue,
      lowStockCount: lowStock.length,
      expiringWithin30DaysCount: expiring.length,
      lowStockItems: lowStock.slice(0, 10),
      expiringItems: expiring.slice(0, 10),
    };
  }

  async getLowStockReport() {
    return this.inventoryRepo.getLowStockMedicines();
  }

  async getExpiryReport(withinDays = 30) {
    return this.inventoryRepo.getExpiringMedicines(withinDays);
  }

  async getTopSellingReport(limit = 20) {
    return this.salesRepo.getTopSellingMedicines(limit);
  }

  async getDashboardSummary() {
    const [
      todaySales,
      inventoryValue,
      lowStockItems,
      expiringItems,
      topMedicines,
    ] = await Promise.all([
      this.salesRepo.getDailySales(new Date()),
      this.inventoryRepo.getInventoryValue(),
      this.inventoryRepo.getLowStockMedicines(),
      this.inventoryRepo.getExpiringMedicines(30),
      this.salesRepo.getTopSellingMedicines(5),
    ]);

    return {
      today: todaySales,
      inventoryValue,
      alerts: {
        lowStockCount: lowStockItems.length,
        expiringCount: expiringItems.length,
      },
      topMedicines,
    };
  }
}
