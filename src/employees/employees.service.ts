import {
  ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee, ConsultantType } from '../database/entities/employee.entity';
import { Company } from '../database/entities/company.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { EmployeeDocument, EmployeeDocCategory } from '../database/entities/employee-document.entity';
import { EmployeePraise } from '../database/entities/employee-praise.entity';
import { EmployeePip } from '../database/entities/employee-pip.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeSelfDto } from './dto/update-employee-self.dto';
import { FilterEmployeeDto } from './dto/filter-employee.dto';
import { AssignProjectDto } from './dto/assign-project.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../database/entities/notification.entity';

const SORTABLE = ['id', 'empCode', 'empName', 'consultantType', 'email', 'isActive', 'createdAt'];

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(EmployeeDocument)
    private readonly empDocRepo: Repository<EmployeeDocument>,
    @InjectRepository(EmployeePraise)
    private readonly praiseRepo: Repository<EmployeePraise>,
    @InjectRepository(EmployeePip)
    private readonly pipRepo: Repository<EmployeePip>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(companyId: number, filter: FilterEmployeeDto) {
    const { page = 1, limit = 20, sort = 'empName', order = 'asc', search, consultantType, assignedProjectId, isActive } = filter;

    const qb = this.employeeRepo
      .createQueryBuilder('e')
      .leftJoin('e.assignedProject', 'p')
      .addSelect(['p.id', 'p.projectCode', 'p.projectName'])
      .leftJoin('e.reportsTo', 'rt')
      .addSelect(['rt.id', 'rt.empName', 'rt.empCode'])
      .where('e.companyId = :companyId', { companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`e.${SORTABLE.includes(sort) ? sort : 'empName'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (search) qb.andWhere('(e.empCode LIKE :s OR e.empName LIKE :s OR e.email LIKE :s)', { s: `%${search}%` });
    if (consultantType) qb.andWhere('e.consultantType = :consultantType', { consultantType });
    if (assignedProjectId) qb.andWhere('e.assignedProjectId = :assignedProjectId', { assignedProjectId });
    if (isActive !== undefined) qb.andWhere('e.isActive = :isActive', { isActive });

    const [data, total] = await qb.getManyAndCount();

    // Include company admins on the first page (so they appear in lists)
    let admins: any[] = [];
    if (page === 1) {
      const adminWhere: any = { companyId, isActive: true };
      const adminResults = await this.adminRepo.find({
        where: adminWhere,
        select: ['id', 'name', 'email', 'role', 'isActive', 'companyId', 'createdAt'],
      });
      admins = adminResults.map((a) => ({
        id: a.id,
        empCode: a.role === 'super_admin' ? 'SUPER-ADMIN' : 'ADMIN',
        empName: a.name,
        email: a.email,
        isActive: a.isActive,
        consultantType: 'admin',
        _type: 'admin',
        createdAt: a.createdAt,
        assignedProject: null,
        reportsTo: null,
      }));
    }

    return { data: [...admins, ...data], meta: { page, limit, total: total + admins.length, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number, companyId: number): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { id, companyId },
      relations: ['assignedProject', 'reportsTo', 'reportsToAdmin'],
    });
    if (!employee) throw new NotFoundException(`Employee #${id} not found`);
    return employee;
  }

  async findAdmin(id: number, companyId: number) {
    const admin = await this.adminRepo.findOne({ where: { id, companyId } });
    if (!admin) throw new NotFoundException(`Admin #${id} not found`);
    // Return in employee-like shape for the frontend
    return {
      id: admin.id,
      empCode: 'ADMIN',
      empName: admin.name,
      email: admin.email,
      mobileNumber: (admin as any).mobileNumber ?? null,
      consultantType: 'admin',
      isActive: true,
      isHr: false,
      dateOfBirth: null,
      joiningDate: null,
      createdAt: admin.createdAt,
      _type: 'admin',
    };
  }

  async findByConsultantType(companyId: number, type: ConsultantType) {
    return this.employeeRepo.find({
      where: { consultantType: type, isActive: true, companyId },
      relations: ['assignedProject'],
    });
  }

  async create(companyId: number, dto: CreateEmployeeDto): Promise<Employee> {
    // Enforce user limit
    await this.validateUserLimit(companyId);

    const codeExists = await this.employeeRepo.findOne({ where: { empCode: dto.empCode, companyId } });
    if (codeExists) throw new ConflictException(`Employee code '${dto.empCode}' already exists`);

    const emailExists = await this.employeeRepo.findOne({ where: { email: dto.email } });
    if (emailExists) throw new ConflictException(`Email '${dto.email}' already registered`);

    const { password, ...rest } = dto;
    const passwordHash = await bcrypt.hash(password, 12);
    const employee = this.employeeRepo.create({ ...rest, passwordHash, companyId });
    const saved = await this.employeeRepo.save(employee);

    await this.notificationsService.create(
      NotificationType.EMPLOYEE_CREATED,
      'New Employee Added',
      `${saved.empName} (${saved.empCode}) has been added to the system.`,
      companyId,
      { employeeId: saved.id },
    );

    return saved;
  }

  async update(id: number, companyId: number, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id, companyId);

    if (dto.empCode && dto.empCode !== employee.empCode) {
      const exists = await this.employeeRepo.findOne({ where: { empCode: dto.empCode, companyId } });
      if (exists) throw new ConflictException(`Employee code '${dto.empCode}' already exists`);
    }
    if (dto.email && dto.email !== employee.email) {
      const exists = await this.employeeRepo.findOne({ where: { email: dto.email } });
      if (exists) throw new ConflictException(`Email '${dto.email}' already registered`);
    }

    Object.assign(employee, dto);

    // Enforce: can only report to employee OR admin, not both
    if (employee.isReportToAdmin) {
      employee.reportsToId = null;
      employee.reportsTo = null;
    } else {
      employee.reportsToAdminId = null;
      employee.reportsToAdmin = null;
    }

    return this.employeeRepo.save(employee);
  }

  async updateSelf(employeeId: number, companyId: number, dto: UpdateEmployeeSelfDto): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({ where: { id: employeeId, companyId } });
    if (!employee) throw new NotFoundException('Employee not found');
    if (dto.empName !== undefined) employee.empName = dto.empName;
    if (dto.mobileNumber !== undefined) employee.mobileNumber = dto.mobileNumber;
    if (dto.dateOfBirth !== undefined) employee.dateOfBirth = dto.dateOfBirth;
    return this.employeeRepo.save(employee);
  }

  async setFillDaysOverride(id: number, companyId: number, days: number | null) {
    const employee = await this.findOne(id, companyId);
    employee.fillDaysOverride = days;
    return this.employeeRepo.save(employee);
  }

  async remove(id: number, companyId: number) {
    const employee = await this.findOne(id, companyId);
    employee.isActive = false;
    await this.employeeRepo.save(employee);

    await this.notificationsService.create(
      NotificationType.EMPLOYEE_DEACTIVATED,
      'Employee Deactivated',
      `${employee.empName} (${employee.empCode}) has been deactivated.`,
      companyId,
      { employeeId: employee.id },
    );

    return { message: `Employee #${id} deactivated successfully` };
  }

  // ── Praises ──────────────────────────────────────────────────────────────

  async getPraises(employeeId: number, companyId: number) {
    return this.praiseRepo.find({ where: { employeeId, companyId }, order: { createdAt: 'DESC' } });
  }

  async givePraise(employeeId: number, companyId: number, givenById: number, givenByType: 'admin' | 'employee', givenByName: string, praiseType: string, description?: string) {
    const praise = this.praiseRepo.create({ employeeId, companyId, givenById, givenByType, givenByName, praiseType, description: description ?? null });
    return this.praiseRepo.save(praise);
  }

  async removePraise(praiseId: number, companyId: number) {
    const praise = await this.praiseRepo.findOne({ where: { id: praiseId, companyId } });
    if (!praise) throw new NotFoundException('Praise not found');
    await this.praiseRepo.remove(praise);
    return { message: 'Praise removed' };
  }

  /// Returns praises for the admin's bridged employee record (matched by email).
  /// If no employee record exists for this admin email, returns an empty list.
  async getAdminOwnPraises(adminEmail: string, companyId: number) {
    if (!companyId) return [];
    const emp = await this.employeeRepo.findOne({
      where: { email: adminEmail, companyId },
    });
    if (!emp) return [];
    return this.praiseRepo.find({
      where: { employeeId: emp.id, companyId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── PIP (Performance Improvement Plan) ───────────────────────────────────

  async getPips(employeeId: number, companyId: number) {
    return this.pipRepo.find({ where: { employeeId, companyId }, order: { createdAt: 'DESC' } });
  }

  async createPip(employeeId: number, companyId: number, initiatedById: number, initiatedByType: 'admin' | 'employee', initiatedByName: string, dto: {
    reason: string; improvementAreas: string; startDate: string; endDate: string; goals?: string;
  }) {
    const pip = this.pipRepo.create({
      employeeId, companyId, initiatedById, initiatedByType, initiatedByName,
      reason: dto.reason, improvementAreas: dto.improvementAreas,
      startDate: dto.startDate, endDate: dto.endDate, goals: dto.goals ?? null,
    });
    const saved = await this.pipRepo.save(pip);

    // Send notification to the employee
    await this.notificationsService.create(
      NotificationType.TASK_STATUS_CHANGED,
      'Performance Improvement Plan',
      `A PIP has been initiated for you by ${initiatedByName}. Reason: ${dto.reason.slice(0, 100)}`,
      companyId,
      { pipId: saved.id },
      employeeId,
    );

    return saved;
  }

  async updatePip(pipId: number, companyId: number, dto: {
    status?: 'active' | 'extended' | 'completed' | 'terminated';
    outcome?: string; reviewNotes?: string; endDate?: string;
  }) {
    const pip = await this.pipRepo.findOne({ where: { id: pipId, companyId } });
    if (!pip) throw new NotFoundException('PIP not found');
    if (dto.status) pip.status = dto.status;
    if (dto.outcome !== undefined) pip.outcome = dto.outcome;
    if (dto.reviewNotes !== undefined) pip.reviewNotes = dto.reviewNotes;
    if (dto.endDate) pip.endDate = dto.endDate;
    return this.pipRepo.save(pip);
  }

  async acknowledgePip(pipId: number, companyId: number, empId: number, empName: string, note?: string) {
    const pip = await this.pipRepo.findOne({ where: { id: pipId, companyId } });
    if (!pip) throw new NotFoundException('PIP not found');
    if (pip.employeeId !== empId) throw new ForbiddenException('You can only acknowledge your own PIP');
    const ackText = `Acknowledged by ${empName} on ${new Date().toISOString().split('T')[0]}${note ? ': ' + note : ''}`;
    pip.reviewNotes = (pip.reviewNotes ? pip.reviewNotes + '\n' : '') + ackText;
    return this.pipRepo.save(pip);
  }

  async deletePip(pipId: number, companyId: number) {
    const pip = await this.pipRepo.findOne({ where: { id: pipId, companyId } });
    if (!pip) throw new NotFoundException('PIP not found');
    await this.pipRepo.remove(pip);
    return { message: 'PIP removed' };
  }

  async toggleActive(id: number, companyId: number) {
    const employee = await this.findOne(id, companyId);
    employee.isActive = !employee.isActive;
    await this.employeeRepo.save(employee);
    return { message: `Employee #${id} ${employee.isActive ? 'activated' : 'deactivated'}`, isActive: employee.isActive };
  }

  async resetPassword(id: number, companyId: number, newPassword: string) {
    const employee = await this.findOne(id, companyId);
    const bcrypt = await import('bcrypt');
    employee.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.employeeRepo.save(employee);
    return { message: `Password reset for employee #${id}` };
  }

  async assignProject(id: number, companyId: number, dto: AssignProjectDto) {
    const employee = await this.findOne(id, companyId);
    employee.assignedProjectId = dto.projectId ?? null;
    await this.employeeRepo.save(employee);
    return { message: `Employee #${id} project assignment updated` };
  }

  async getUpcomingEvents(companyId: number, days = 30) {
    const today = new Date();
    const events: {
      id: number; name: string; type: 'birthday' | 'anniversary';
      date: string; daysUntil: number; _type: 'employee' | 'admin';
    }[] = [];

    const employees = await this.employeeRepo.find({
      where: { companyId, isActive: true },
      select: ['id', 'empName', 'dateOfBirth', 'joiningDate'],
    });
    const admins = await this.adminRepo.find({
      where: { companyId, isActive: true },
      select: ['id', 'name', 'dateOfBirth', 'joiningDate'],
    });

    const calcDaysUntil = (dateStr: string): number => {
      const d = new Date(dateStr);
      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      return Math.round((next.getTime() - today.getTime()) / 86400000);
    };

    for (const emp of employees) {
      if (emp.dateOfBirth) {
        const du = calcDaysUntil(emp.dateOfBirth);
        if (du <= days) events.push({ id: emp.id, name: emp.empName, type: 'birthday', date: emp.dateOfBirth, daysUntil: du, _type: 'employee' });
      }
      if (emp.joiningDate) {
        const du = calcDaysUntil(emp.joiningDate);
        if (du <= days) events.push({ id: emp.id, name: emp.empName, type: 'anniversary', date: emp.joiningDate, daysUntil: du, _type: 'employee' });
      }
    }
    for (const admin of admins) {
      if (admin.dateOfBirth) {
        const du = calcDaysUntil(admin.dateOfBirth);
        if (du <= days) events.push({ id: admin.id, name: admin.name, type: 'birthday', date: admin.dateOfBirth, daysUntil: du, _type: 'admin' });
      }
      if (admin.joiningDate) {
        const du = calcDaysUntil(admin.joiningDate);
        if (du <= days) events.push({ id: admin.id, name: admin.name, type: 'anniversary', date: admin.joiningDate, daysUntil: du, _type: 'admin' });
      }
    }

    events.sort((a, b) => a.daysUntil - b.daysUntil);
    return events;
  }

  async getTodayEvents(companyId: number) {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayMD = `${mm}-${dd}`;

    type TodayEvent = {
      id: number; name: string; empCode?: string; email: string;
      phone?: string; type: 'birthday' | 'anniversary'; _type: 'employee' | 'admin';
      dateOfBirth?: string | null; joiningDate?: string | null;
      reportsTo?: { id: number; name: string } | null;
    };
    const events: TodayEvent[] = [];

    const employees = await this.employeeRepo
      .createQueryBuilder('e')
      .leftJoin('e.reportsTo', 'rt')
      .addSelect(['rt.id', 'rt.empName'])
      .where('e.companyId = :cid', { cid: companyId })
      .andWhere('e.isActive = true')
      .select([
        'e.id', 'e.empName', 'e.empCode', 'e.email', 'e.mobileNumber',
        'e.dateOfBirth', 'e.joiningDate',
      ])
      .getMany();

    for (const emp of employees) {
      if (emp.dateOfBirth && emp.dateOfBirth.slice(5) === todayMD) {
        events.push({
          id: emp.id, name: emp.empName, empCode: emp.empCode, email: emp.email,
          phone: emp.mobileNumber, type: 'birthday', _type: 'employee',
          dateOfBirth: emp.dateOfBirth, joiningDate: emp.joiningDate,
          reportsTo: (emp as any).reportsTo
            ? { id: (emp as any).reportsTo.id, name: (emp as any).reportsTo.empName }
            : null,
        });
      }
      if (emp.joiningDate && emp.joiningDate.slice(5) === todayMD) {
        events.push({
          id: emp.id, name: emp.empName, empCode: emp.empCode, email: emp.email,
          phone: emp.mobileNumber, type: 'anniversary', _type: 'employee',
          dateOfBirth: emp.dateOfBirth, joiningDate: emp.joiningDate,
          reportsTo: (emp as any).reportsTo
            ? { id: (emp as any).reportsTo.id, name: (emp as any).reportsTo.empName }
            : null,
        });
      }
    }

    const admins = await this.adminRepo.find({
      where: { companyId, isActive: true },
      select: ['id', 'name', 'email', 'dateOfBirth', 'joiningDate'],
    });
    for (const admin of admins) {
      if (admin.dateOfBirth && admin.dateOfBirth.slice(5) === todayMD) {
        events.push({
          id: admin.id, name: admin.name, email: admin.email,
          type: 'birthday', _type: 'admin',
          dateOfBirth: admin.dateOfBirth, joiningDate: admin.joiningDate,
          reportsTo: null,
        });
      }
      if (admin.joiningDate && admin.joiningDate.slice(5) === todayMD) {
        events.push({
          id: admin.id, name: admin.name, email: admin.email,
          type: 'anniversary', _type: 'admin',
          dateOfBirth: admin.dateOfBirth, joiningDate: admin.joiningDate,
          reportsTo: null,
        });
      }
    }

    return events;
  }

  private async validateUserLimit(companyId: number): Promise<void> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const currentCount = await this.employeeRepo.count({ where: { companyId, isActive: true } });
    if (currentCount >= company.userLimit) {
      throw new ForbiddenException(
        `User limit reached (${company.userLimit}). Contact platform admin to increase your limit.`,
      );
    }
  }

  // ── Employee Documents ────────────────────────────────────────────────────

  async getDocuments(userType: string, userId: number, companyId: number) {
    return this.empDocRepo.find({
      where: { userType, userId, companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async uploadDocument(
    userType: string,
    userId: number,
    companyId: number,
    file: Express.Multer.File,
    uploadedByName: string,
    category?: string,
  ) {
    if (!file) throw new NotFoundException('No file uploaded. Check file type is allowed (pdf, doc, docx, xls, xlsx, jpg, jpeg, png, gif, webp, txt).');
    const validCategories = Object.values(EmployeeDocCategory);
    const cat = validCategories.includes(category as EmployeeDocCategory)
      ? (category as EmployeeDocCategory)
      : EmployeeDocCategory.OTHER;

    const doc = this.empDocRepo.create({
      userType,
      userId,
      companyId,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: `/uploads/employee-documents/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      category: cat,
      uploadedByName,
    });
    return this.empDocRepo.save(doc);
  }

  async deleteDocument(docId: number, companyId: number) {
    const doc = await this.empDocRepo.findOne({ where: { id: docId, companyId } });
    if (!doc) throw new NotFoundException('Document not found');
    const fs = await import('fs');
    const { join } = await import('path');
    try {
      const filePath = join(process.cwd(), 'uploads', 'employee-documents', doc.fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* ignore */ }
    await this.empDocRepo.remove(doc);
    return { message: 'Document deleted' };
  }
}
