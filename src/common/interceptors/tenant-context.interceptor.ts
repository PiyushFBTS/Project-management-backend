import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AdminRole } from '../../database/entities/admin-user.entity';

/**
 * Extracts `companyId` from the authenticated user (set by Passport strategy)
 * and places it on `request.tenantId` for downstream consumption.
 *
 * Super admins can optionally set `X-Company-Id` header to impersonate a
 * company. Regular admins/employees always use their own companyId.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user) {
      if (user.role === AdminRole.SUPER_ADMIN) {
        request.isSuperAdmin = true;
        const headerCompanyId = request.headers['x-company-id'];
        if (headerCompanyId) {
          const parsed = parseInt(headerCompanyId, 10);
          request.tenantId =
            Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        } else {
          request.tenantId = null;
        }
      } else {
        // Regular admin / employee: always use their own companyId
        request.tenantId = user.companyId ?? null;
      }
    }

    return next.handle();
  }
}
