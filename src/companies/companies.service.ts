import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from '../database/entities/company.entity';
import { AdminUser, AdminRole } from '../database/entities/admin-user.entity';
import { Employee } from '../database/entities/employee.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { FilterCompanyDto } from './dto/filter-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  // ── Company CRUD ──────────────────────────────────────────────────────────

  async create(dto: CreateCompanyDto): Promise<Company> {
    const slugExists = await this.companyRepo.findOne({ where: { slug: dto.slug } });
    if (slugExists) throw new ConflictException(`Company slug '${dto.slug}' already exists`);

    const company = this.companyRepo.create(dto);
    return this.companyRepo.save(company);
  }

  async findAll(filter: FilterCompanyDto) {
    const { page = 1, limit = 20, search, subscriptionPlan, isActive } = filter;

    const qb = this.companyRepo
      .createQueryBuilder('c')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('c.createdAt', 'DESC');

    if (search) {
      qb.andWhere('(c.name LIKE :s OR c.slug LIKE :s OR c.contactEmail LIKE :s)', { s: `%${search}%` });
    }
    if (subscriptionPlan) {
      qb.andWhere('c.subscriptionPlan = :subscriptionPlan', { subscriptionPlan });
    }
    if (isActive !== undefined) {
      qb.andWhere('c.isActive = :isActive', { isActive });
    }

    const [data, total] = await qb.getManyAndCount();

    // Enrich with counts
    const enriched = await Promise.all(
      data.map(async (company) => {
        const [adminCount, employeeCount] = await Promise.all([
          this.adminRepo.count({ where: { companyId: company.id, isActive: true } }),
          this.employeeRepo.count({ where: { companyId: company.id, isActive: true } }),
        ]);
        return { ...company, adminCount, employeeCount };
      }),
    );

    return { data: enriched, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    return company;
  }

  async update(id: number, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);

    if (dto.slug && dto.slug !== company.slug) {
      const exists = await this.companyRepo.findOne({ where: { slug: dto.slug } });
      if (exists) throw new ConflictException(`Company slug '${dto.slug}' already exists`);
    }

    Object.assign(company, dto);
    return this.companyRepo.save(company);
  }

  async updateLogo(id: number, logoUrl: string) {
    const company = await this.findOne(id);
    company.logoUrl = logoUrl;
    await this.companyRepo.save(company);
    return { logoUrl };
  }

  async deactivate(id: number) {
    const company = await this.findOne(id);
    company.isActive = false;
    await this.companyRepo.save(company);
    return { message: `Company '${company.name}' deactivated` };
  }

  async toggleActive(id: number) {
    const company = await this.findOne(id);
    company.isActive = !company.isActive;
    await this.companyRepo.save(company);
    return { message: `Company '${company.name}' is now ${company.isActive ? 'active' : 'inactive'}` };
  }

  // ── License management ────────────────────────────────────────────────────

  async updateLicense(id: number, dto: UpdateLicenseDto): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, dto);
    return this.companyRepo.save(company);
  }

  // ── Company admin management ──────────────────────────────────────────────

  async createAdmin(companyId: number, dto: CreateCompanyAdminDto): Promise<AdminUser> {
    await this.findOne(companyId); // ensure company exists

    const emailExists = await this.adminRepo.findOne({ where: { email: dto.email } });
    if (emailExists) throw new ConflictException(`Email '${dto.email}' already registered`);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const admin = this.adminRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: AdminRole.ADMIN,
      companyId,
      isActive: true,
    });

    const saved = await this.adminRepo.save(admin);
    // Remove passwordHash from response
    const { passwordHash: _, ...result } = saved as any;
    return result;
  }

  async getAdmins(companyId: number) {
    await this.findOne(companyId);
    return this.adminRepo.find({
      where: { companyId },
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── Super admin overview dashboard ────────────────────────────────────────

  async getPlatformDashboard() {
    const totalCompanies = await this.companyRepo.count();
    const activeCompanies = await this.companyRepo.count({ where: { isActive: true } });
    const totalAdmins = await this.adminRepo.count({ where: { role: AdminRole.ADMIN } });
    const totalEmployees = await this.employeeRepo.count({ where: { isActive: true } });

    // Companies expiring within 30 days
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const expiringSoon = await this.companyRepo
      .createQueryBuilder('c')
      .where('c.isActive = :active', { active: true })
      .andWhere('c.licenseExpiryDate <= :expiry', { expiry: thirtyDaysLater.toISOString().split('T')[0] })
      .andWhere('c.licenseExpiryDate >= :today', { today: today.toISOString().split('T')[0] })
      .getCount();

    return {
      totalCompanies,
      activeCompanies,
      totalAdmins,
      totalEmployees,
      expiringSoon,
    };
  }
}
