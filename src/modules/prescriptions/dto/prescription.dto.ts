import {
  IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum,
  IsDateString, IsArray, ValidateNested,
  IsNumber, IsPositive, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PrescriptionStatus } from '../../../common/enums';

export class CreatePrescriptionItemDto {
  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  medicineId?: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  medicineName: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  dosage?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  frequency?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @IsPositive()
  @Type(() => Number)
  durationDays?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @IsPositive()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  doctorName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  doctorLicense?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  hospitalName?: string;

  @ApiProperty({ example: '2026-05-29' })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreatePrescriptionItemDto] })
  @IsOptional() @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items?: CreatePrescriptionItemDto[];
}

export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {
  @ApiPropertyOptional({ enum: PrescriptionStatus })
  @IsOptional() @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;
}
