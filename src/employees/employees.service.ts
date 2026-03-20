import {
  ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee, ConsultantType } from '../database/entities/employee.entity';
import { Company } from '../database/entities/company.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
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
      relations: ['assignedProject', 'reportsTo'],
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
}
