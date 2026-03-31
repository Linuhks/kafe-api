import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        // Se o use case já retornou { data, pagination }, repassa direto
        if (this.isPaginated(value)) {
          return value;
        }
        // Caso contrário, envolve em { data }
        return { data: value };
      }),
    );
  }

  private isPaginated(value: unknown): value is PaginatedResult<unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'data' in value &&
      'pagination' in value
    );
  }
}
