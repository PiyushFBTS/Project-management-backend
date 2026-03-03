import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole } from '../../database/entities/admin-user.entity';

/**
 * Ensures the authenticated user is a super admin.
 * Use with `@UseGuards(JwtAdminGuard, SuperAdminGuard)` on platform-level endpoints.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access restricted to super admins only');
    }

    return true;
  }
}
