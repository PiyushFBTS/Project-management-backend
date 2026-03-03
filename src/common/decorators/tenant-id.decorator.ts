import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts `tenantId` (companyId) from the request.
 * Set by TenantContextInterceptor after authentication.
 *
 * Usage: `@TenantId() companyId: number`
 *
 * Returns `null` for super admin (platform-level) requests.
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId ?? null;
  },
);
