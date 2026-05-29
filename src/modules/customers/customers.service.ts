import { Injectable } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
} from '../../common/exceptions/app.exception';

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}

  async create(dto: CreateCustomerDto, createdBy: string) {
    if (dto.phone) {
      const exists = await this.repo.findByPhone(dto.phone);
      if (exists) throw new DuplicateResourceException('Customer', 'phone number');
    }
    return this.repo.create({ ...dto, dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined, createdBy });
  }

  async findAll(filter: QueryFilterDto) {
    return this.repo.findAll(filter);
  }

  async findOne(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) throw new ResourceNotFoundException('Customer', id);
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, updatedBy: string) {
    await this.findOne(id);
    return this.repo.update(id, { ...dto, dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined, updatedBy });
  }

  async remove(id: string, deletedBy: string) {
    await this.findOne(id);
    await this.repo.softDelete(id, deletedBy);
    return { message: 'Customer deleted successfully' };
  }
}
