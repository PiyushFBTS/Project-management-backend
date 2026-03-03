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

    return {
      accessToken: this.signAdminAccess(admin),
      refreshToken: this.signAdminRefresh(admin),
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        companyId: admin.companyId,
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

  // ── Employee ───────────────────────────────────────────────────────────────

  async loginEmployee(dto: EmployeeLoginDto) {
    const employee = await this.employeeRepo.findOne({
      where: { email: dto.email, isActive: true },
      select: [
        'id', 'empCode', 'empName', 'email',
        'consultantType', 'assignedProjectId', 'isActive', 'passwordHash',
        'companyId', 'isHr',
      ],
    });
    if (!employee) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, employee.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Employees always belong to a company — validate license
    await this.validateCompanyLicense(employee.companyId);

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
}
