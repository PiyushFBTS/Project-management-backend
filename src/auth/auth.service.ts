import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../database/entities/admin-user.entity';
import { Employee } from '../database/entities/employee.entity';
import { Company } from '../database/entities/company.entity';
import { ClientUser } from '../database/entities/client-user.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { EmployeeLoginDto } from './dto/employee-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(ClientUser)
    private readonly clientRepo: Repository<ClientUser>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Admin ──────────────────────────────────────────────────────────────────

  async loginAdmin(dto: AdminLoginDto) {
    const admin = await this.adminRepo.findOne({
      where: { email: dto.email, isActive: true },
      select: ['id', 'name', 'email', 'role', 'isActive', 'passwordHash', 'companyId'],
    });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Company admins require active + non-expired company license
    if (admin.companyId) {
      await this.validateCompanyLicense(admin.companyId);
    }

    // Fetch company logo for the response
    let companyLogoUrl: string | null = null;
    let companyName: string | null = null;
    if (admin.companyId) {
      const company = await this.companyRepo.findOne({
        where: { id: admin.companyId },
        select: ['id', 'logoUrl', 'name'],
      });
      if (company) {
        companyLogoUrl = company.logoUrl;
        companyName = company.name;
      }
    }

    return {
      accessToken: this.signAdminAccess(admin),
      refreshToken: this.signAdminRefresh(admin),
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        companyId: admin.companyId,
        companyLogoUrl,
        companyName,
      },
    };
  }

  async refreshAdminToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'admin') throw new UnauthorizedException();
      const admin = await this.adminRepo.findOne({
        where: { id: payload.sub, isActive: true },
      });
      if (!admin) throw new UnauthorizedException();

      // Re-validate company license on refresh
      if (admin.companyId) {
        await this.validateCompanyLicense(admin.companyId);
      }

      return { accessToken: this.signAdminAccess(admin) };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async changeAdminPassword(adminId: number, dto: ChangePasswordDto) {
    const admin = await this.adminRepo.findOne({
      where: { id: adminId },
      select: ['id', 'passwordHash'],
    });
    const valid = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    await this.adminRepo.update(adminId, {
      passwordHash: await bcrypt.hash(dto.newPassword, 12),
    });
    return { message: 'Password changed successfully' };
  }

  async enrichAdminProfile(profile: any) {
    if (profile.companyId) {
      const company = await this.companyRepo.findOne({
        where: { id: profile.companyId },
        select: ['id', 'logoUrl', 'name'],
      });
      if (company) {
        profile.companyLogoUrl = company.logoUrl;
        profile.companyName = company.name;
      }
    }
    return profile;
  }

  // ── Employee ───────────────────────────────────────────────────────────────

  async loginEmployee(dto: EmployeeLoginDto) {
    const employee = await this.employeeRepo.findOne({
      where: { email: dto.email },
      select: [
        'id', 'empCode', 'empName', 'email',
        'consultantType', 'assignedProjectId', 'isActive', 'passwordHash',
        'companyId', 'isHr',
      ],
    });
    if (!employee) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, employee.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Deactivated accounts: tell the user to contact their admin rather
    // than confusing them with "invalid credentials".
    if (!employee.isActive) {
      throw new ForbiddenException(
        'Your account is inactive. Please contact your admin to log in.',
      );
    }

    // Employees always belong to a company — validate license
    await this.validateCompanyLicense(employee.companyId);

    // Fetch company logo & name for the header
    let companyLogoUrl: string | null = null;
    let companyName: string | null = null;
    if (employee.companyId) {
      const company = await this.companyRepo.findOne({
        where: { id: employee.companyId },
        select: ['id', 'logoUrl', 'name'],
      });
      if (company) {
        companyLogoUrl = company.logoUrl;
        companyName = company.name;
      }
    }

    return {
      accessToken: this.signEmployeeAccess(employee),
      refreshToken: this.signEmployeeRefresh(employee),
      user: {
        id: employee.id,
        empCode: employee.empCode,
        empName: employee.empName,
        email: employee.email,
        consultantType: employee.consultantType,
        assignedProjectId: employee.assignedProjectId,
        companyId: employee.companyId,
        isHr: employee.isHr,
        companyLogoUrl,
        companyName,
      },
    };
  }

  async refreshEmployeeToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_EMPLOYEE_REFRESH_SECRET'),
      });
      if (payload.type !== 'employee') throw new UnauthorizedException();
      const employee = await this.employeeRepo.findOne({
        where: { id: payload.sub, isActive: true },
      });
      if (!employee) throw new UnauthorizedException();

      // Re-validate company license on refresh
      await this.validateCompanyLicense(employee.companyId);

      return { accessToken: this.signEmployeeAccess(employee) };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getEmployeeProfile(employeeId: number) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['reportsTo', 'assignedProject'],
    });
    if (!employee) throw new UnauthorizedException('Employee not found');
    const { passwordHash, ...profile } = employee;

    // Attach company logo for header display
    if (profile.companyId) {
      const company = await this.companyRepo.findOne({
        where: { id: profile.companyId },
        select: ['id', 'logoUrl', 'name'],
      });
      if (company) {
        (profile as any).companyLogoUrl = company.logoUrl;
        (profile as any).companyName = company.name;
      }
    }
    return profile;
  }

  async changeEmployeePassword(employeeId: number, dto: ChangePasswordDto) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      select: ['id', 'passwordHash'],
    });
    const valid = await bcrypt.compare(
      dto.currentPassword,
      employee.passwordHash,
    );
    if (!valid) throw new BadRequestException('Current password is incorrect');
    await this.employeeRepo.update(employeeId, {
      passwordHash: await bcrypt.hash(dto.newPassword, 12),
    });
    return { message: 'Password changed successfully' };
  }

  // ── License validation ───────────────────────────────────────────────────

  private async validateCompanyLicense(companyId: number): Promise<void> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) {
      throw new ForbiddenException('Company not found');
    }
    if (!company.isActive) {
      throw new ForbiddenException('Your company account has been deactivated. Contact platform admin.');
    }
    const today = new Date().toISOString().split('T')[0];
    if (company.licenseExpiryDate < today) {
      throw new ForbiddenException('Company license has expired. Contact platform admin to renew.');
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private signAdminAccess(admin: AdminUser) {
    return this.jwtService.sign(
      {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        companyId: admin.companyId,
        type: 'admin',
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRY', '15m'),
      },
    );
  }

  private signAdminRefresh(admin: AdminUser) {
    return this.jwtService.sign(
      {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        companyId: admin.companyId,
        type: 'admin',
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
      },
    );
  }

  private signEmployeeAccess(employee: Employee) {
    return this.jwtService.sign(
      {
        sub: employee.id,
        email: employee.email,
        consultantType: employee.consultantType,
        companyId: employee.companyId,
        type: 'employee',
      },
      {
        secret: this.configService.get<string>('JWT_EMPLOYEE_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EMPLOYEE_EXPIRY', '1h'),
      },
    );
  }

  private signEmployeeRefresh(employee: Employee) {
    return this.jwtService.sign(
      {
        sub: employee.id,
        email: employee.email,
        consultantType: employee.consultantType,
        companyId: employee.companyId,
        type: 'employee',
      },
      {
        secret: this.configService.get<string>('JWT_EMPLOYEE_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_EMPLOYEE_REFRESH_EXPIRY',
          '30d',
        ),
      },
    );
  }

  // ── Client ──────────────────────────────────────────────────────────────────

  async loginClient(dto: { email: string; password: string }) {
    const client = await this.clientRepo.findOne({
      where: { email: dto.email, isActive: true },
      select: ['id', 'fullName', 'email', 'passwordHash', 'projectId', 'companyId', 'mobileNumber'],
      relations: ['project'],
    });
    if (!client) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, client.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Fetch company info
    const company = await this.companyRepo.findOne({ where: { id: client.companyId } });

    const accessToken = this.signClientAccess(client);
    const refreshToken = this.signClientRefresh(client);

    return {
      accessToken,
      refreshToken,
      user: {
        id: client.id,
        fullName: client.fullName,
        email: client.email,
        mobileNumber: client.mobileNumber,
        projectId: client.projectId,
        projectName: client.project?.projectName ?? null,
        companyId: client.companyId,
        companyName: company?.name ?? null,
        companyLogoUrl: company?.logoUrl ?? null,
      },
    };
  }

  async getClientProfile(clientId: number) {
    const client = await this.clientRepo.findOne({
      where: { id: clientId, isActive: true },
      relations: ['project'],
    });
    if (!client) throw new UnauthorizedException('Client not found');
    const company = await this.companyRepo.findOne({ where: { id: client.companyId } });
    return {
      id: client.id,
      fullName: client.fullName,
      email: client.email,
      mobileNumber: client.mobileNumber,
      projectId: client.projectId,
      projectName: client.project?.projectName ?? null,
      companyId: client.companyId,
      companyName: company?.name ?? null,
      companyLogoUrl: company?.logoUrl ?? null,
    };
  }

  async refreshClientToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_CLIENT_SECRET', 'client-secret-change-me'),
      });
      if (payload.type !== 'client') throw new Error();
      const client = await this.clientRepo.findOne({ where: { id: payload.sub, isActive: true } });
      if (!client) throw new Error();
      return { accessToken: this.signClientAccess(client) };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private signClientAccess(client: ClientUser) {
    return this.jwtService.sign(
      {
        sub: client.id,
        email: client.email,
        projectId: client.projectId,
        companyId: client.companyId,
        type: 'client',
      },
      {
        secret: this.configService.get<string>('JWT_CLIENT_SECRET', 'client-secret-change-me'),
        expiresIn: this.configService.get<string>('JWT_CLIENT_EXPIRY', '1h'),
      },
    );
  }

  private signClientRefresh(client: ClientUser) {
    return this.jwtService.sign(
      {
        sub: client.id,
        email: client.email,
        projectId: client.projectId,
        companyId: client.companyId,
        type: 'client',
      },
      {
        secret: this.configService.get<string>('JWT_CLIENT_SECRET', 'client-secret-change-me'),
        expiresIn: '30d',
      },
    );
  }
}
