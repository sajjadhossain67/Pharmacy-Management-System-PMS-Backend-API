import {
  IsString, IsEmail, IsNotEmpty, IsOptional,
  IsEnum, MinLength, MaxLength, IsDateString, IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole, UserStatus, Gender } from '../../../common/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'john@pharma.com' })
  @IsEmail() @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString() @MinLength(8) @MaxLength(64)
  password: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsOptional() @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CASHIER })
  @IsOptional() @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional() @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  branchId?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional() @IsEnum(UserStatus)
  status?: UserStatus;
}
