import {
  IsString, IsNotEmpty, IsOptional, IsEmail,
  IsEnum, IsDateString, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Gender } from '../../../common/enums';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ahmed' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional() @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  allergies?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  medicalHistory?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  insuranceProvider?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  insuranceNumber?: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
