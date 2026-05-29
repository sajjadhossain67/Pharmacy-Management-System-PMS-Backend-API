import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateMedicineDto, UpdateMedicineDto, AdjustStockDto } from './dto/medicine.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  ApiCreateResponse, ApiPaginatedResponse,
  ApiUpdateResponse, ApiDeleteResponse,
} from '../../common/decorators/api-response.decorator';

@ApiTags('Inventory')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Medicines ────────────────────────────────────────────────

  @Post('medicines')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiCreateResponse('Create a new medicine')
  createMedicine(@Body() dto: CreateMedicineDto, @CurrentUser() user: JwtPayload) {
    return this.inventoryService.createMedicine(dto, user.sub);
  }

  @Get('medicines')
  @ApiPaginatedResponse('List all medicines with dynamic filters')
  findAllMedicines(@Query() filter: QueryFilterDto) {
    return this.inventoryService.findAllMedicines(filter);
  }

  @Get('medicines/low-stock')
  @ApiPaginatedResponse('List medicines below minimum stock level')
  getLowStock() {
    return this.inventoryService.getLowStockMedicines();
  }

  @Get('medicines/expiring')
  @ApiQuery({ name: 'withinDays', required: false, type: Number, example: 30 })
  getExpiring(@Query('withinDays') withinDays?: number) {
    return this.inventoryService.getExpiringMedicines(withinDays ? +withinDays : 30);
  }

  @Get('medicines/value')
  getInventoryValue() {
    return this.inventoryService.getInventoryValue();
  }

  @Get('medicines/barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.inventoryService.findByBarcode(barcode);
  }

  @Get('medicines/:id')
  findMedicine(@Param('id') id: string) {
    return this.inventoryService.findMedicine(id);
  }

  @Put('medicines/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiUpdateResponse('Update medicine')
  updateMedicine(
    @Param('id') id: string,
    @Body() dto: UpdateMedicineDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.updateMedicine(id, dto, user.sub);
  }

  @Patch('medicines/:id/adjust-stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST)
  adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.adjustStock(id, dto, user.sub);
  }

  @Get('medicines/:id/movements')
  getStockMovements(@Param('id') id: string, @Query() filter: QueryFilterDto) {
    return this.inventoryService.getStockMovements(id, filter);
  }

  @Delete('medicines/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiDeleteResponse('Delete medicine')
  removeMedicine(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.inventoryService.removeMedicine(id, user.sub);
  }

  // ─── Categories ───────────────────────────────────────────────

  @Post('categories')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiCreateResponse('Create medicine category')
  createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() user: JwtPayload) {
    return this.inventoryService.createCategory(dto, user.sub);
  }

  @Get('categories')
  findAllCategories() {
    return this.inventoryService.findAllCategories();
  }

  @Get('categories/:id')
  findCategory(@Param('id') id: string) {
    return this.inventoryService.findCategory(id);
  }

  @Put('categories/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.updateCategory(id, dto, user.sub);
  }

  @Delete('categories/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  removeCategory(@Param('id') id: string) {
    return this.inventoryService.removeCategory(id);
  }
}
