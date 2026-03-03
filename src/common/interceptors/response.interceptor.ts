import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta: Record<string, any> | null;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        // If handler already shaped the response, pass through
        if (result && typeof result === 'object' && 'success' in result) {
          return result;
        }
        return {
          success: true,
          data: result?.data !== undefined ? result.data : result,
          message: result?.message ?? 'OK',
          meta: result?.meta ?? null,
        };
      }),
    );
  }
}
