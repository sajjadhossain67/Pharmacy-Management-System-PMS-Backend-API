import {
  IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum,
  IsNumber, IsDateString, IsArray, ValidateNested, IsPositive, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../../../common/enums';

export class CreatePurchaseOrderItemDto {
  @ApiProperty()
  @IsUUID()
  medicineId: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  medicineName: string;

  @ApiProperty({ example: 100 })
  @IsNumber() @IsPositive()
  @Type(() => Number)
  orderedQuantity: number;

  @ApiProperty({ example: 45.00 })
  @IsNumber() @IsPositive()
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  taxPercent?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  expiryDate?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiProperty({ example: '2026-05-29' })
  @IsDateString()
  orderDate: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {
  @ApiPropertyOptional({ enum: PurchaseOrderStatus })
  @IsOptional() @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ description: 'Map of itemId to received quantity' })
  receivedItems: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  receivedDate?: string;
}

export class CreateReorderPurchaseOrderDto {
  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiPropertyOptional({ description: 'Only include these medicine IDs. If omitted, all matching reorder suggestions for the supplier are used.' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  medicineIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
