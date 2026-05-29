import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { CustomQueryBuilder } from '../../common/custom-queries/query.builder';
import { PaginatedResult } from '../../common/interceptors/response.interceptor';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id, isDeleted: false } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { email: email.toLowerCase(), isDeleted: false },
    });
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.repo.update(id, { isDeleted: true, updatedBy: deletedBy } as any);
    await this.repo.softDelete(id);
  }

  async findAll(filter: QueryFilterDto): Promise<PaginatedResult<UserEntity>> {
    const qb = this.repo
      .createQueryBuilder('user')
      .where('user.is_deleted = false');

    CustomQueryBuilder.applyFilters(qb, filter, 'user', [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
    ]);

    return CustomQueryBuilder.paginate(qb, filter);
  }

  async countByRole(): Promise<{ role: string; count: string }[]> {
    return this.repo
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.is_deleted = false')
      .groupBy('user.role')
      .getRawMany();
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('user')
      .where('user.email = :email', { email: email.toLowerCase() })
      .andWhere('user.is_deleted = false');

    if (excludeId) {
      qb.andWhere('user.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }
}
