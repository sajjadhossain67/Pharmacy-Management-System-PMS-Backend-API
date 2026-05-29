import {
  IsString, IsNotEmpty, IsOptional, IsEmail,
  IsEnum, IsNumber, Min, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SupplierStatus } from '../../../common/enums';

export class CreateSupplierDto {
  @ApiProperty({ example: 'PharmaCo Ltd' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  taxId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  paymentTermsDays?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  creditLimit?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @ApiPropertyOptional({ enum: SupplierStatus })
  @IsOptional() @IsEnum(SupplierStatus)
  status?: SupplierStatus;
}
