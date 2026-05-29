import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { hashPassword } from '../../common/utils/hash.util';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
} from '../../common/exceptions/app.exception';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly events: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto, createdBy: string) {
    const exists = await this.usersRepo.existsByEmail(dto.email);
    if (exists) throw new DuplicateResourceException('User', 'email');

    const hashed = await hashPassword(dto.password);
    const user = await this.usersRepo.create({
      ...dto,
      password: hashed,
      createdBy,
    } as any);

    this.events.emit('user.created', { userId: user.id, createdBy });
    return user;
  }

  async findAll(filter: QueryFilterDto) {
    return this.usersRepo.findAll(filter);
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new ResourceNotFoundException('User', id);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedBy: string) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new ResourceNotFoundException('User', id);

    if (dto.email && dto.email !== user.email) {
      const exists = await this.usersRepo.existsByEmail(dto.email, id);
      if (exists) throw new DuplicateResourceException('User', 'email');
    }

    const data: any = { 
      ...dto, 
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined, 
      updatedBy 
    };
    if (dto.password) {
      data.password = await hashPassword(dto.password);
    }

    return this.usersRepo.update(id, data);
  }

  async remove(id: string, deletedBy: string) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new ResourceNotFoundException('User', id);
    await this.usersRepo.softDelete(id, deletedBy);
    return { message: 'User deleted successfully' };
  }

  async getStats() {
    return this.usersRepo.countByRole();
  }
}
