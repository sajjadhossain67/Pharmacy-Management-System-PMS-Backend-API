import { Injectable } from '@nestjs/common';
import { PrescriptionsRepository } from './prescriptions.repository';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/prescription.dto';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { ResourceNotFoundException } from '../../common/exceptions/app.exception';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly repo: PrescriptionsRepository) {}

  async create(dto: CreatePrescriptionDto, createdBy: string) {
    const prescriptionNumber = await this.repo.generatePrescriptionNumber();
    return this.repo.create({
      ...dto,
      prescriptionNumber,
      issueDate: new Date(dto.issueDate),
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      items: dto.items as any,
      createdBy,
    } as any);
  }

  async findAll(filter: QueryFilterDto) {
    return this.repo.findAll(filter);
  }

  async findOne(id: string) {
    const rx = await this.repo.findById(id);
    if (!rx) throw new ResourceNotFoundException('Prescription', id);
    return rx;
  }

  async update(id: string, dto: UpdatePrescriptionDto, updatedBy: string) {
    await this.findOne(id);
    return this.repo.update(id, { ...dto, issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined, validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined, items: dto.items as any, updatedBy } as any);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.softDelete(id);
    return { message: 'Prescription deleted' };
  }
}
