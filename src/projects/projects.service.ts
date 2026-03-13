import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from '../database/entities/project.entity';
import { Employee } from '../database/entities/employee.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectDto } from './dto/filter-project.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../database/entities/notification.entity';

const SORTABLE = ['id', 'projectCode', 'projectName', 'projectType', 'status', 'createdAt'];

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(Employee) private readonly employeeRepo: Repository<Employee>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(companyId: number, filter: FilterProjectDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, projectType, status } = filter;

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .leftJoin('p.createdBy', 'admin')
      .addSelect(['admin.id', 'admin.name', 'admin.email'])
      .where('p.companyId = :companyId', { companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`p.${SORTABLE.includes(sort) ? sort : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (search) qb.andWhere('(p.projectCode LIKE :s OR p.projectName LIKE :s)', { s: `%${search}%` });
    if (projectType) qb.andWhere('p.projectType = :projectType', { projectType });
    if (status) qb.andWhere('p.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number, companyId: number): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id, companyId }, relations: ['createdBy'] });
    if (!project) throw new NotFoundException(`Project #${id} not found`);
    return project;
  }

  async create(companyId: number, dto: CreateProjectDto, adminId: number): Promise<Project> {
    const existing = await this.projectRepo.findOne({ where: { projectCode: dto.projectCode, companyId } });
    if (existing) throw new ConflictException(`Project code '${dto.projectCode}' already exists`);
    const project = this.projectRepo.create({ ...dto, createdById: adminId, companyId });
    const saved = await this.projectRepo.save(project);

    await this.notificationsService.create(
      NotificationType.PROJECT_CREATED,
      'New Project Created',
      `Project "${saved.projectName}" (${saved.projectCode}) has been created.`,
      companyId,
      { projectId: saved.id },
    );

    return saved;
  }

  async update(id: number, companyId: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id, companyId);
    if (dto.projectCode && dto.projectCode !== project.projectCode) {
      const exists = await this.projectRepo.findOne({ where: { projectCode: dto.projectCode, companyId } });
      if (exists) throw new ConflictException(`Project code '${dto.projectCode}' already exists`);
    }

    const prevStatus = project.status;
    Object.assign(project, dto);
    const saved = await this.projectRepo.save(project);

    if (dto.status && dto.status !== prevStatus) {
      await this.notificationsService.create(
        NotificationType.PROJECT_UPDATED,
        'Project Status Changed',
        `Project "${saved.projectName}" status changed from ${prevStatus} to ${saved.status}.`,
        companyId,
        { projectId: saved.id },
      );
    }

    return saved;
  }

  async remove(id: number, companyId: number) {
    const project = await this.findOne(id, companyId);
    project.status = ProjectStatus.INACTIVE;
    await this.projectRepo.save(project);
    return { message: `Project #${id} deactivated successfully` };
  }

  async findByEmployeeTickets(companyId: number, employeeId: number) {
    const projects = await this.projectRepo
      .createQueryBuilder('p')
      .where('p.companyId = :companyId', { companyId })
      .andWhere(
        `p.id IN (SELECT DISTINCT t.project_id FROM project_tasks t WHERE t.company_id = :companyId AND t.assignee_id = :employeeId)`,
        { companyId, employeeId },
      )
      .orderBy('p.projectName', 'ASC')
      .getMany();
    return { data: projects, meta: { total: projects.length } };
  }

  async getEmployees(id: number, companyId: number) {
    await this.findOne(id, companyId);
    return this.employeeRepo.find({
      where: { assignedProjectId: id, isActive: true, companyId },
      select: ['id', 'empCode', 'empName', 'consultantType', 'email', 'mobileNumber'],
    });
  }
}
