import { Injectable } from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
} from '../../common/exceptions/app.exception';

@Injectable()
export class SuppliersService {
  constructor(private readonly repo: SuppliersRepository) {}

  async create(dto: CreateSupplierDto, createdBy: string) {
    if (dto.email) {
      const exists = await this.repo.existsByEmail(dto.email);
      if (exists) throw new DuplicateResourceException('Supplier', 'email');
    }
    return this.repo.create({ ...dto, createdBy });
  }

  async findAll(filter: QueryFilterDto) {
    return this.repo.findAll(filter);
  }

  async findOne(id: string) {
    const supplier = await this.repo.findById(id);
    if (!supplier) throw new ResourceNotFoundException('Supplier', id);
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, updatedBy: string) {
    await this.findOne(id);
    if (dto.email) {
      const exists = await this.repo.existsByEmail(dto.email, id);
      if (exists) throw new DuplicateResourceException('Supplier', 'email');
    }
    return this.repo.update(id, { ...dto, updatedBy });
  }

  async remove(id: string, deletedBy: string) {
    await this.findOne(id);
    await this.repo.softDelete(id, deletedBy);
    return { message: 'Supplier deleted successfully' };
  }
}
