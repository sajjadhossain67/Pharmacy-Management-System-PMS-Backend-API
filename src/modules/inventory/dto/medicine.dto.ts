import {
  IsString, IsNotEmpty, IsOptional, IsNumber,
  IsEnum, IsBoolean, IsDateString, IsUUID,
  Min, MaxLength, IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MedicineType } from '../../../common/enums';

export class CreateMedicineDto {
  @ApiProperty({ example: 'Amoxicillin 500mg' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Amoxicillin' })
  @IsOptional() @IsString()
  genericName?: string;

  @ApiProperty({ example: 'MED-001' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional() @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: MedicineType })
  @IsOptional() @IsEnum(MedicineType)
  type?: MedicineType;

  @ApiProperty({ example: 45.00 })
  @IsNumber() @IsPositive()
  @Type(() => Number)
  buyingPrice: number;

  @ApiProperty({ example: 60.00 })
  @IsNumber() @IsPositive()
  @Type(() => Number)
  sellingPrice: number;

  @ApiPropertyOptional({ example: 65.00 })
  @IsOptional() @IsNumber() @IsPositive()
  @Type(() => Number)
  mrp?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  minimumStock?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  reorderPoint?: number;

  @ApiPropertyOptional({ example: 'pcs' })
  @IsOptional() @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional() @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  requiresPrescription?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  isControlled?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  taxPercent?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  sideEffects?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  storageCondition?: string;
}

export class UpdateMedicineDto extends PartialType(CreateMedicineDto) {}

export class AdjustStockDto {
  @ApiProperty({ example: 50, description: 'Quantity to add (positive) or remove (negative)' })
  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  batchNumber?: string;
}
