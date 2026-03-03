import {
  ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee, ConsultantType } from '../database/entities/employee.entity';
import { Company } from '../database/entities/company.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
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
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number, companyId: number): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { id, companyId },
      relations: ['assignedProject', 'reportsTo'],
    });
    if (!employee) throw new NotFoundException(`Employee #${id} not found`);
    return employee;
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
