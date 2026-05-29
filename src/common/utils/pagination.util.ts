import { PaginationMeta } from '../interceptors/response.interceptor';

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

export function calcSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
