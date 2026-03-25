import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { Project, ProjectStatus } from '../database/entities/project.entity';
import { Employee } from '../database/entities/employee.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { ProjectDocument, DocumentCategory } from '../database/entities/project-document.entity';
import { ProjectMilestone } from '../database/entities/project-milestone.entity';
import { ProjectTypeEntity } from '../database/entities/project-type.entity';
import { ClientUser } from '../database/entities/client-user.entity';
import { CreateClientDto } from './dto/create-client.dto';
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
    @InjectRepository(AdminUser) private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(ProjectDocument) private readonly docRepo: Repository<ProjectDocument>,
    @InjectRepository(ProjectMilestone) private readonly milestoneRepo: Repository<ProjectMilestone>,
    @InjectRepository(ProjectTypeEntity) private readonly projectTypeRepo: Repository<ProjectTypeEntity>,
    @InjectRepository(ClientUser) private readonly clientRepo: Repository<ClientUser>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(companyId: number, filter: FilterProjectDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, projectType, status } = filter;

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .leftJoin('p.createdBy', 'admin')
      .addSelect(['admin.id', 'admin.name', 'admin.email'])
      .leftJoin('p.projectManager', 'pm')
      .addSelect(['pm.id', 'pm.empName', 'pm.empCode'])
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
    const project = await this.projectRepo.findOne({ where: { id, companyId }, relations: ['createdBy', 'projectManager'] });
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
    // Clear the stale loaded relation so TypeORM uses the updated FK value
    // (otherwise TypeORM overwrites projectManagerId with the old relation's id)
    if ('projectManagerId' in dto) {
      project.projectManager = null as any;
    }
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

  async getManagers(companyId: number) {
    return this.employeeRepo.find({
      where: { companyId, isActive: true },
      select: ['id', 'empName', 'empCode'],
      order: { empName: 'ASC' },
    });
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  async getDocuments(projectId: number, companyId: number) {
    return this.docRepo.find({
      where: { projectId, companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async uploadDocument(
    projectId: number,
    companyId: number,
    file: Express.Multer.File,
    uploadedByName: string,
    category?: string,
  ) {
    const project = await this.projectRepo.findOne({ where: { id: projectId, companyId } });
    if (!project) throw new NotFoundException('Project not found');

    const validCategories = Object.values(DocumentCategory);
    const cat = validCategories.includes(category as DocumentCategory)
      ? (category as DocumentCategory)
      : DocumentCategory.OTHER;

    const doc = this.docRepo.create({
      projectId,
      companyId,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: `/uploads/project-documents/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      category: cat,
      uploadedByName,
    });

    return this.docRepo.save(doc);
  }

  async deleteDocument(projectId: number, docId: number, companyId: number) {
    const doc = await this.docRepo.findOne({ where: { id: docId, projectId, companyId } });
    if (!doc) throw new NotFoundException('Document not found');

    // Delete file from disk
    try {
      const filePath = join(process.cwd(), 'uploads', 'project-documents', doc.fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* ignore file deletion errors */ }

    await this.docRepo.remove(doc);
    return { message: 'Document deleted' };
  }

  // ── Client Users ───────────────────────────────────────────────────────────

  async getClients(projectId: number, companyId: number) {
    return this.clientRepo.find({
      where: { projectId, companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async createClient(projectId: number, companyId: number, dto: CreateClientDto) {
    const project = await this.projectRepo.findOne({ where: { id: projectId, companyId } });
    if (!project) throw new NotFoundException('Project not found');

    // Check duplicate email within company
    const existing = await this.clientRepo.findOne({ where: { email: dto.email, companyId } });
    if (existing) throw new ConflictException('A client with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const client = this.clientRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      mobileNumber: dto.mobileNumber ?? null,
      projectId,
      companyId,
    });
    return this.clientRepo.save(client);
  }

  async deleteClient(projectId: number, clientId: number, companyId: number) {
    const client = await this.clientRepo.findOne({ where: { id: clientId, projectId, companyId } });
    if (!client) throw new NotFoundException('Client not found');
    await this.clientRepo.remove(client);
    return { message: 'Client removed' };
  }

  // ── Milestones ──────────────────────────────────────────────────────────────

  async getMilestones(projectId: number, companyId: number) {
    return this.milestoneRepo.find({
      where: { projectId, companyId },
      order: { id: 'ASC' },
    });
  }

  async createMilestone(projectId: number, companyId: number, dto: { name: string; expectedPercentage: number; expectedAmount: number; receivedPercentage?: number; receivedAmount?: number }) {
    await this.findOne(projectId, companyId);
    const milestone = this.milestoneRepo.create({
      projectId,
      companyId,
      name: dto.name,
      expectedPercentage: dto.expectedPercentage,
      expectedAmount: dto.expectedAmount,
      receivedPercentage: dto.receivedPercentage ?? 0,
      receivedAmount: dto.receivedAmount ?? 0,
    });
    return this.milestoneRepo.save(milestone);
  }

  async bulkCreateMilestones(projectId: number, companyId: number, milestones: Array<{ name: string; expectedPercentage: number; expectedAmount: number; receivedPercentage?: number; receivedAmount?: number }>) {
    const entities = milestones.map((m) =>
      this.milestoneRepo.create({
        projectId,
        companyId,
        name: m.name,
        expectedPercentage: m.expectedPercentage,
        expectedAmount: m.expectedAmount,
        receivedPercentage: m.receivedPercentage ?? 0,
        receivedAmount: m.receivedAmount ?? 0,
      }),
    );
    return this.milestoneRepo.save(entities);
  }

  async updateMilestone(projectId: number, milestoneId: number, companyId: number, dto: { name?: string; expectedPercentage?: number; expectedAmount?: number; receivedPercentage?: number; receivedAmount?: number }) {
    const milestone = await this.milestoneRepo.findOne({ where: { id: milestoneId, projectId, companyId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    Object.assign(milestone, dto);
    return this.milestoneRepo.save(milestone);
  }

  async deleteMilestone(projectId: number, milestoneId: number, companyId: number) {
    const milestone = await this.milestoneRepo.findOne({ where: { id: milestoneId, projectId, companyId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    await this.milestoneRepo.remove(milestone);
    return { message: 'Milestone deleted' };
  }

  // ── Project Types ───────────────────────────────────────────────────────────

  async getProjectTypes(companyId: number) {
    return this.projectTypeRepo.find({
      where: { companyId, isActive: true },
      order: { id: 'ASC' },
    });
  }

  async createProjectType(companyId: number, dto: { value: string; label: string; description?: string }) {
    const val = dto.value.toLowerCase().replace(/\s+/g, '_').trim();
    const existing = await this.projectTypeRepo.findOne({ where: { value: val, companyId } });
    if (existing) throw new ConflictException(`Project type "${val}" already exists`);
    const pt = this.projectTypeRepo.create({
      value: val,
      label: dto.label.trim(),
      description: dto.description?.trim() ?? '',
      companyId,
    });
    return this.projectTypeRepo.save(pt);
  }

  async deleteProjectType(companyId: number, typeId: number) {
    const pt = await this.projectTypeRepo.findOne({ where: { id: typeId, companyId } });
    if (!pt) throw new NotFoundException('Project type not found');
    await this.projectTypeRepo.remove(pt);
    return { message: 'Project type deleted' };
  }
}
