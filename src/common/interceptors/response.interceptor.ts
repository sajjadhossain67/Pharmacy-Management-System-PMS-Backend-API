import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
  requestId?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const requestId = request.headers['x-request-id'];

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;

        // If the data is already a paginated result, extract meta
        if (data && data.data !== undefined && data.meta !== undefined) {
          return {
            success: true,
            statusCode,
            message: 'Request processed successfully',
            data: data.data,
            meta: data.meta,
            timestamp: new Date().toISOString(),
            requestId,
          };
        }

        return {
          success: true,
          statusCode,
          message: 'Request processed successfully',
          data,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }
}
