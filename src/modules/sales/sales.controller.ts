import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto, RefundSaleDto } from './dto/sale.dto';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Sales')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSale(@Body() dto: CreateSaleDto, @CurrentUser() user: JwtPayload) {
    return this.salesService.createSale(dto, user.sub);
  }

  @Get()
  findAll(@Query() filter: QueryFilterDto) {
    return this.salesService.findAll(filter);
  }

  @Get('summary/daily')
  getDailySummary(@Query('date') date?: string) {
    return this.salesService.getDailySummary(date ? new Date(date) : undefined);
  }

  @Get('top-medicines')
  getTopMedicines(@Query('limit') limit?: number) {
    return this.salesService.getTopSellingMedicines(limit ? +limit : 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Patch(':id/refund')
  @HttpCode(HttpStatus.OK)
  refund(
    @Param('id') id: string,
    @Body() dto: RefundSaleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.salesService.refundSale(id, dto, user.sub);
  }
}
