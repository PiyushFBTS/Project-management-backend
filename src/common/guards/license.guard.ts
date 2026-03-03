import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../database/entities/company.entity';

/**
 * Global guard that enforces company license constraints on every request.
 *
 * Behaviour:
 * - Super admin (tenantId = null): always allowed (bypasses check).
 * - Company deactivated (is_active = false): ALL requests blocked.
 * - License expired: GET requests allowed (read-only mode),
 *   POST/PATCH/PUT/DELETE requests blocked with 403.
 */
@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId: number | null = request.tenantId;
    const isSuperAdmin: boolean = request.isSuperAdmin ?? false;

    // Super admin or no company context — skip license checks
    if (!tenantId || isSuperAdmin) return true;

    const company = await this.companyRepo.findOne({ where: { id: tenantId } });
    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    // Hard kill switch — nothing works
    if (!company.isActive) {
      throw new ForbiddenException(
        'Your company account has been deactivated. Contact platform admin.',
      );
    }

    // License expiry — allow reads, block writes
    const today = new Date().toISOString().split('T')[0];
    if (company.licenseExpiryDate < today) {
      const method = request.method?.toUpperCase();
      if (method !== 'GET') {
        throw new ForbiddenException(
          'Company license has expired — read-only mode. Contact platform admin to renew.',
        );
      }
    }

    return true;
  }
}
