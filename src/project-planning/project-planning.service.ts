import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProjectPhase } from '../database/entities/project-phase.entity';
import { ProjectTask } from '../database/entities/project-task.entity';
import { ProjectTaskComment, AuthorType } from '../database/entities/project-task-comment.entity';
import { Project } from '../database/entities/project.entity';
import { Employee } from '../database/entities/employee.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../database/entities/notification.entity';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';

@Injectable()
export class ProjectPlanningService {
  constructor(
    @InjectRepository(ProjectPhase)
    private readonly phaseRepo: Repository<ProjectPhase>,
    @InjectRepository(ProjectTask)
    private readonly taskRepo: Repository<ProjectTask>,
    @InjectRepository(ProjectTaskComment)
    private readonly commentRepo: Repository<ProjectTaskComment>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async ensureProject(projectId: number, companyId: number): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id: projectId, companyId } });
    if (!project) throw new NotFoundException(`Project #${projectId} not found`);
    return project;
  }

  private async ensureTask(taskId: number, companyId: number): Promise<ProjectTask> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, companyId },
      relations: ['assignee', 'phase', 'project'],
    });
    if (!task) throw new NotFoundException(`Task #${taskId} not found`);
    return task;
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  async getSummary(projectId: number, companyId: number) {
    await this.ensureProject(projectId, companyId);

    const byStatus = await this.taskRepo
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('t.project_id = :projectId AND t.company_id = :companyId', { projectId, companyId })
      .groupBy('t.status')
      .getRawMany();

    const byPriority = await this.taskRepo
      .createQueryBuilder('t')
      .select('t.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('t.project_id = :projectId AND t.company_id = :companyId', { projectId, companyId })
      .groupBy('t.priority')
      .getRawMany();

    const totalTasks = byStatus.reduce((sum, r) => sum + Number(r.count), 0);
    const doneTasks = Number(byStatus.find((r) => r.status === 'done')?.count ?? 0);

    return {
      totalTasks,
      doneTasks,
      progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      byStatus,
      byPriority,
    };
  }

  // ── Phases ───────────────────────────────────────────────────────────────────

  async listPhases(projectId: number, companyId: number) {
    await this.ensureProject(projectId, companyId);
    return this.phaseRepo.find({
      where: { projectId, companyId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async createPhase(projectId: number, companyId: number, dto: CreatePhaseDto) {
    await this.ensureProject(projectId, companyId);

    const maxSort = await this.phaseRepo
      .createQueryBuilder('p')
      .select('MAX(p.sort_order)', 'max')
      .where('p.project_id = :projectId', { projectId })
      .getRawOne();

    const phase = this.phaseRepo.create({
      ...dto,
      projectId,
      companyId,
      sortOrder: (maxSort?.max ?? 0) + 1,
    });
    return this.phaseRepo.save(phase);
  }

  async updatePhase(phaseId: number, companyId: number, dto: UpdatePhaseDto) {
    const phase = await this.phaseRepo.findOne({ where: { id: phaseId, companyId } });
    if (!phase) throw new NotFoundException(`Phase #${phaseId} not found`);
    Object.assign(phase, dto);
    return this.phaseRepo.save(phase);
  }

  async deletePhase(phaseId: number, companyId: number) {
    const phase = await this.phaseRepo.findOne({ where: { id: phaseId, companyId } });
    if (!phase) throw new NotFoundException(`Phase #${phaseId} not found`);
    await this.phaseRepo.remove(phase);
    return { message: `Phase #${phaseId} deleted` };
  }

  async reorderPhases(projectId: number, companyId: number, phaseIds: number[]) {
    await this.ensureProject(projectId, companyId);
    for (let i = 0; i < phaseIds.length; i++) {
      await this.phaseRepo.update({ id: phaseIds[i], companyId }, { sortOrder: i });
    }
    return { message: 'Phases reordered' };
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────

  async listTasks(projectId: number, companyId: number, filter: FilterTasksDto) {
    await this.ensureProject(projectId, companyId);

    const { page = 1, limit = 50, sort = 'sortOrder', order = 'asc', status, priority, assigneeId, phaseId } = filter;

    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.assignee', 'assignee')
      .leftJoinAndSelect('t.phase', 'phase')
      .where('t.project_id = :projectId AND t.company_id = :companyId', { projectId, companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`t.${sort === 'sortOrder' ? 'sortOrder' : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (status) qb.andWhere('t.status = :status', { status });
    if (priority) qb.andWhere('t.priority = :priority', { priority });
    if (assigneeId) qb.andWhere('t.assignee_id = :assigneeId', { assigneeId });
    if (phaseId) qb.andWhere('t.phase_id = :phaseId', { phaseId });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createTask(projectId: number, companyId: number, dto: CreateTaskDto) {
    const project = await this.ensureProject(projectId, companyId);

    const maxSort = await this.taskRepo
      .createQueryBuilder('t')
      .select('MAX(t.sort_order)', 'max')
      .where('t.project_id = :projectId', { projectId })
      .getRawOne();

    // Generate ticket number: PROJCODE-001
    const taskCount = await this.taskRepo
      .createQueryBuilder('t')
      .where('t.project_id = :projectId', { projectId })
      .getCount();
    const seq = String(taskCount + 1).padStart(3, '0');
    const ticketNumber = `${project.projectCode}-${seq}`;

    const task = this.taskRepo.create({
      ...dto,
      projectId,
      companyId,
      ticketNumber,
      sortOrder: (maxSort?.max ?? 0) + 1,
    });
    const saved = await this.taskRepo.save(task);

    if (saved.assigneeId) {
      await this.notificationsService.create(
        NotificationType.TASK_ASSIGNED,
        'New Task Assigned',
        `You have been assigned "${saved.title}" in project "${project.projectName}".`,
        companyId,
        { taskId: saved.id, projectId },
        saved.assigneeId,
      );
    }

    return saved;
  }

  async getTaskDetail(taskId: number, companyId: number) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, companyId },
      relations: ['assignee', 'phase', 'project', 'comments'],
    });
    if (!task) throw new NotFoundException(`Task #${taskId} not found`);

    // Sort comments by date and resolve author names
    if (task.comments?.length) {
      task.comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Batch-fetch employee and admin names
      const empIds = [...new Set(task.comments.filter((c) => c.authorType === AuthorType.EMPLOYEE).map((c) => c.authorId))];
      const adminIds = [...new Set(task.comments.filter((c) => c.authorType === AuthorType.ADMIN).map((c) => c.authorId))];

      const nameMap: Record<string, string> = {};

      if (empIds.length) {
        const employees = await this.employeeRepo.find({ where: { id: In(empIds) } });
        employees.forEach((e) => (nameMap[`employee_${e.id}`] = e.empName));
      }
      if (adminIds.length) {
        const admins = await this.adminRepo.find({ where: { id: In(adminIds) } });
        admins.forEach((a) => (nameMap[`admin_${a.id}`] = a.name));
      }

      task.comments.forEach((c: any) => {
        c.authorName = nameMap[`${c.authorType}_${c.authorId}`] ?? 'Unknown';
      });
    }

    return task;
  }

  async updateTask(taskId: number, companyId: number, dto: UpdateTaskDto) {
    const task = await this.ensureTask(taskId, companyId);
    const prevAssignee = task.assigneeId;
    const prevStatus = task.status;

    Object.assign(task, dto);
    const saved = await this.taskRepo.save(task);

    // Notify new assignee
    if (dto.assigneeId && dto.assigneeId !== prevAssignee) {
      await this.notificationsService.create(
        NotificationType.TASK_ASSIGNED,
        'New Task Assigned',
        `You have been assigned "${saved.title}" in project "${task.project.projectName}".`,
        companyId,
        { taskId: saved.id, projectId: saved.projectId },
        saved.assigneeId,
      );
    }

    // Notify assignee of status change (if changed by admin)
    if (dto.status && dto.status !== prevStatus && saved.assigneeId) {
      await this.notificationsService.create(
        NotificationType.TASK_STATUS_CHANGED,
        'Task Status Updated',
        `Task "${saved.title}" status changed from ${prevStatus} to ${saved.status}.`,
        companyId,
        { taskId: saved.id, projectId: saved.projectId },
        saved.assigneeId,
      );
    }

    return saved;
  }

  async deleteTask(taskId: number, companyId: number) {
    const task = await this.taskRepo.findOne({ where: { id: taskId, companyId } });
    if (!task) throw new NotFoundException(`Task #${taskId} not found`);
    await this.taskRepo.remove(task);
    return { message: `Task #${taskId} deleted` };
  }

  // ── Comments ─────────────────────────────────────────────────────────────────

  async addComment(
    taskId: number,
    companyId: number,
    authorId: number,
    authorType: AuthorType,
    dto: CreateCommentDto,
  ) {
    const task = await this.ensureTask(taskId, companyId);

    // Resolve author name
    let authorName = 'Someone';
    if (authorType === AuthorType.EMPLOYEE) {
      const emp = await this.employeeRepo.findOne({ where: { id: authorId }, select: ['id', 'empName'] });
      if (emp) authorName = emp.empName;
    } else {
      const admin = await this.adminRepo.findOne({ where: { id: authorId }, select: ['id', 'name'] });
      if (admin) authorName = admin.name;
    }

    const comment = this.commentRepo.create({
      taskId,
      authorId,
      authorType,
      content: dto.content,
      companyId,
    });
    const saved = await this.commentRepo.save(comment);

    // Notify assignee when someone else comments
    // Admin IDs and Employee IDs are from different tables, so always notify
    // assignee when an admin comments; for employees, skip if they are the assignee
    const isAssigneeSelf = authorType === AuthorType.EMPLOYEE && task.assigneeId === authorId;
    if (task.assigneeId && !isAssigneeSelf) {
      await this.notificationsService.create(
        NotificationType.TASK_COMMENTED,
        'New Comment on Task',
        `${authorName} commented on "${task.title}".`,
        companyId,
        { taskId, projectId: task.projectId, commentId: saved.id },
        task.assigneeId,
      );
    }

    // Notify admins when an employee comments (no targetEmployeeId → visible to admins)
    if (authorType === AuthorType.EMPLOYEE) {
      await this.notificationsService.create(
        NotificationType.TASK_COMMENTED,
        'Employee Comment on Task',
        `${authorName} commented on "${task.title}" in project "${task.project.projectName}".`,
        companyId,
        { taskId, projectId: task.projectId, commentId: saved.id },
      );
    }

    return saved;
  }

  // ── Employee: My Tasks ───────────────────────────────────────────────────────

  async getMyTasks(employeeId: number, companyId: number, filter: FilterTasksDto) {
    const { page = 1, limit = 50, sort = 'createdAt', order = 'desc', search, status, priority, projectId } = filter;

    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.project', 'project')
      .leftJoinAndSelect('t.phase', 'phase')
      .where('t.assignee_id = :employeeId AND t.company_id = :companyId', { employeeId, companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`t.${sort === 'sortOrder' ? 'sortOrder' : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (search) qb.andWhere('t.ticket_number LIKE :s', { s: `%${search}` });
    if (status) qb.andWhere('t.status = :status', { status });
    if (priority) qb.andWhere('t.priority = :priority', { priority });
    if (projectId) qb.andWhere('t.project_id = :projectId', { projectId });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateMyTaskStatus(taskId: number, employeeId: number, companyId: number, dto: UpdateTaskStatusDto) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, companyId, assigneeId: employeeId },
      relations: ['project'],
    });
    if (!task) throw new ForbiddenException('Task not found or not assigned to you');

    const prevStatus = task.status;
    task.status = dto.status;
    const saved = await this.taskRepo.save(task);

    await this.notificationsService.create(
      NotificationType.TASK_STATUS_CHANGED,
      'Task Status Updated',
      `Task "${saved.title}" in "${task.project.projectName}" changed from ${prevStatus} to ${saved.status}.`,
      companyId,
      { taskId: saved.id, projectId: saved.projectId, updatedBy: employeeId },
    );

    return saved;
  }

  // ── Autocomplete suggestions ────────────────────────────────────────────────

  async autocompleteTickets(query: string, companyId: number) {
    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.project', 'project')
      .leftJoinAndSelect('t.assignee', 'assignee')
      .leftJoinAndSelect('t.phase', 'phase')
      .where('t.company_id = :companyId', { companyId })
      .andWhere('t.ticket_number LIKE :q', { q: `%${query}` })
      .orderBy('t.ticket_number', 'ASC')
      .take(10);

    return qb.getMany();
  }

  // ── Search by ticket number (any employee in the company) ──────────────────

  async searchByTicket(ticketNumber: string, companyId: number) {
    const task = await this.taskRepo.findOne({
      where: { ticketNumber, companyId },
      relations: ['assignee', 'phase', 'project', 'comments'],
    });
    if (!task) throw new NotFoundException(`Ticket "${ticketNumber}" not found`);

    // Sort comments and resolve author names
    if (task.comments?.length) {
      task.comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const empIds = [...new Set(task.comments.filter((c) => c.authorType === AuthorType.EMPLOYEE).map((c) => c.authorId))];
      const adminIds = [...new Set(task.comments.filter((c) => c.authorType === AuthorType.ADMIN).map((c) => c.authorId))];
      const nameMap: Record<string, string> = {};

      if (empIds.length) {
        const employees = await this.employeeRepo.find({ where: { id: In(empIds) } });
        employees.forEach((e) => (nameMap[`employee_${e.id}`] = e.empName));
      }
      if (adminIds.length) {
        const admins = await this.adminRepo.find({ where: { id: In(adminIds) } });
        admins.forEach((a) => (nameMap[`admin_${a.id}`] = a.name));
      }

      task.comments.forEach((c: any) => {
        c.authorName = nameMap[`${c.authorType}_${c.authorId}`] ?? 'Unknown';
      });
    }

    return task;
  }
}
