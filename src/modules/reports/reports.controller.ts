import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('dashboard/trends')
  getDashboardTrends() {
    return this.reportsService.getDashboardTrends();
  }

  @Get('revenue')
  @ApiQuery({ name: 'period', enum: ['daily', 'monthly', 'yearly'], required: false })
  @ApiQuery({ name: 'date', required: false, type: String })
  getRevenue(
    @Query('period') period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    @Query('date') date?: string,
  ) {
    return this.reportsService.getRevenueReport(period, date ? new Date(date) : undefined);
  }

  @Get('inventory')
  getInventory() {
    return this.reportsService.getInventoryReport();
  }

  @Get('low-stock')
  getLowStock() {
    return this.reportsService.getLowStockReport();
  }

  @Get('expiry')
  @ApiQuery({ name: 'withinDays', required: false, type: Number })
  getExpiry(@Query('withinDays') withinDays?: number) {
    return this.reportsService.getExpiryReport(withinDays ? +withinDays : 30);
  }

  @Get('top-selling')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopSelling(@Query('limit') limit?: number) {
    return this.reportsService.getTopSellingReport(limit ? +limit : 20);
  }

  @Get('reorder-suggestions')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getReorderSuggestions(@Query('limit') limit?: number) {
    return this.reportsService.getReorderSuggestionsReport(limit ? +limit : 20);
  }

  @Get('export/:type')
  @ApiQuery({ name: 'period', enum: ['daily', 'monthly', 'yearly'], required: false })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  exportReport(
    @Param('type') type: 'revenue' | 'inventory' | 'top-selling',
    @Query('period') period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    @Query('date') date?: string,
    @Query('limit') limit?: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const filename = `reports-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (type === 'revenue') {
      return this.reportsService.exportRevenueReportCsv(period, date ? new Date(date) : undefined);
    }

    if (type === 'inventory') {
      return this.reportsService.exportInventoryReportCsv();
    }

    return this.reportsService.exportTopSellingReportCsv(limit ? +limit : 20);
  }
}
