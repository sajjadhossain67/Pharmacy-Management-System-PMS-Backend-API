import {
  IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum,
  IsNumber, IsArray, ValidateNested, IsPositive, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../common/enums';

export class CreateSaleItemDto {
  @ApiProperty()
  @IsUUID()
  medicineId: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  medicineName: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  medicineSku?: string;

  @ApiProperty({ example: 2 })
  @IsNumber() @IsPositive()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 60.00 })
  @IsNumber() @IsPositive()
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  taxPercent?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  batchNumber?: string;
}

export class CreateSaleDto {
  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  prescriptionId?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 150.00, description: 'Amount paid by customer' })
  @IsNumber() @Min(0)
  @Type(() => Number)
  paidAmount: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}

export class RefundSaleDto {
  @ApiProperty({ description: 'Map of saleItemId to refund quantity' })
  refundItems: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  reason?: string;
}
