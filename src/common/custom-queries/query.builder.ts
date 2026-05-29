import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { QueryFilterDto } from '../dto/query-filter.dto';
import { PaginatedResult } from '../interceptors/response.interceptor';

export class CustomQueryBuilder {
  /**
   * Apply search, date range, status, sortBy/sortOrder to a QueryBuilder.
   * @param qb            The query builder instance
   * @param filter        DTO with page/limit/search/sort/status/dates
   * @param alias         Entity alias used in the query
   * @param searchFields  List of columns to search against (default: [])
   */
  static applyFilters<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    filter: QueryFilterDto,
    alias: string,
    searchFields: string[] = [],
  ): void {
    // Full-text search across specified fields
    if (filter.search && searchFields.length > 0) {
      const searchConditions = searchFields
        .map((field) => `CAST(${alias}.${field} AS TEXT) ILIKE :search`)
        .join(' OR ');
      qb.andWhere(`(${searchConditions})`, { search: `%${filter.search}%` });
    }

    // Status filter
    if (filter.status) {
      qb.andWhere(`${alias}.status = :status`, { status: filter.status });
    }

    // Branch filter
    if (filter.branchId) {
      qb.andWhere(`${alias}.branch_id = :branchId`, { branchId: filter.branchId });
    }

    // Date range
    if (filter.startDate) {
      qb.andWhere(`${alias}.created_at >= :startDate`, { startDate: new Date(filter.startDate) });
    }
    if (filter.endDate) {
      qb.andWhere(`${alias}.created_at <= :endDate`, { endDate: new Date(filter.endDate) });
    }

    // Sorting
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'DESC';
    const safeField = sortBy.replace(/[^a-zA-Z0-9_]/g, '');
    qb.orderBy(`${alias}.${safeField}`, sortOrder);
  }

  /**
   * Apply pagination and return a structured paginated result.
   */
  static async paginate<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    filter: QueryFilterDto,
  ): Promise<PaginatedResult<T>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  }
}
