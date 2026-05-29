import { Injectable } from '@nestjs/common';
import { SalesRepository } from '../sales/sales.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear } from '../../common/utils/date.util';

export interface DashboardSummary {
  today: {
    total: number;
    count: number;
  };
  revenueTrend: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  inventoryValue: number;
  inventoryKpis: {
    activeMedicines: number;
    totalUnits: number;
    lowStockCount: number;
    expiringWithin30DaysCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    medicineCount: number;
    stockUnits: number;
    inventoryValue: number;
  }>;
  topMedicines: Array<Record<string, unknown>>;
}

export interface ReorderSuggestion {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  reorderPoint: number;
  minimumStock: number;
  suggestedOrderQuantity: number;
  category?: string;
  supplierId?: string;
}

type RevenueReportRow = {
  date: string;
  revenue: string;
  transactions: string;
};

type InventoryReportRow = {
  id?: string;
  name?: string;
  sku?: string;
  stockQuantity?: number;
  minimumStock?: number;
  expiryDate?: string | Date;
  category?: { name?: string } | string;
};

type TopSellingRow = {
  medicineId?: string;
  medicineName?: string;
  totalSold?: string;
  totalRevenue?: string;
};

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

  async getReorderSuggestionsReport(limit = 20): Promise<ReorderSuggestion[]> {
    return this.inventoryRepo.getReorderSuggestions(limit);
  }

  async exportRevenueReportCsv(period: 'daily' | 'monthly' | 'yearly', date?: Date): Promise<string> {
    const report = await this.getRevenueReport(period, date);
    const rows = report.breakdown as RevenueReportRow[];

    return this.buildCsv([
      ['date', 'revenue', 'transactions'],
      ...rows.map((row) => [row.date, row.revenue, row.transactions]),
    ]);
  }

  async exportInventoryReportCsv(): Promise<string> {
    const [lowStock, expiring, inventoryValue] = await Promise.all([
      this.inventoryRepo.getLowStockMedicines(),
      this.inventoryRepo.getExpiringMedicines(30),
      this.inventoryRepo.getInventoryValue(),
    ]);

    return this.buildCsv([
      ['section', 'id', 'name', 'sku', 'stockQuantity', 'minimumStock', 'expiryDate', 'category', 'inventoryValue'],
      ...lowStock.map((item) => [
        'low-stock',
        item.id,
        item.name,
        item.sku,
        String(item.stockQuantity),
        String(item.minimumStock),
        item.expiryDate ? new Date(item.expiryDate).toISOString() : '',
        item.category?.name ?? '',
        '',
      ]),
      ...expiring.map((item) => [
        'expiring',
        item.id,
        item.name,
        item.sku,
        String(item.stockQuantity),
        String(item.minimumStock),
        item.expiryDate ? new Date(item.expiryDate).toISOString() : '',
        item.category?.name ?? '',
        '',
      ]),
      ['summary', '', '', '', '', '', '', '', String(inventoryValue)],
    ]);
  }

  async exportTopSellingReportCsv(limit = 20): Promise<string> {
    const rows = (await this.getTopSellingReport(limit)) as TopSellingRow[];

    return this.buildCsv([
      ['medicineId', 'medicineName', 'totalSold', 'totalRevenue'],
      ...rows.map((row) => [row.medicineId, row.medicineName, row.totalSold, row.totalRevenue]),
    ]);
  }

  async getDashboardTrends() {
    const [revenueTrend, categoryBreakdown] = await Promise.all([
      this.salesRepo.getRevenueTrend(7),
      this.inventoryRepo.getCategoryBreakdown(8),
    ]);

    return {
      revenueTrend,
      categoryBreakdown,
    };
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const [todaySales, inventoryValue, inventoryKpis, categoryBreakdown, topMedicines] = await Promise.all([
      this.salesRepo.getDailySales(new Date()),
      this.inventoryRepo.getInventoryValue(),
      this.inventoryRepo.getInventoryKpis(),
      this.inventoryRepo.getCategoryBreakdown(5),
      this.salesRepo.getTopSellingMedicines(5),
    ]);

    return {
      today: todaySales,
      revenueTrend: await this.salesRepo.getRevenueTrend(7),
      inventoryValue,
      inventoryKpis,
      categoryBreakdown,
      topMedicines,
    };
  }

  private buildCsv(rows: Array<Array<string | number | undefined | null>>): string {
    return rows
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
      .join('\n');
  }

  private escapeCsvValue(value: string | number | undefined | null): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (/[",\n\r]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }
}
