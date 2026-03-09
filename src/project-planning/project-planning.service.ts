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
import { ProjectTaskHistory, TaskHistoryAction } from '../database/entities/project-task-history.entity';

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
    @InjectRepository(ProjectTaskHistory)
    private readonly historyRepo: Repository<ProjectTaskHistory>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Record a history entry for a task */
  private async recordHistory(
    taskId: number,
    companyId: number,
    action: TaskHistoryAction,
    performedById: number,
    performedByType: 'admin' | 'employee',
    performedByName: string,
    oldValue?: string | null,
    newValue?: string | null,
    details?: string | null,
  ) {
    const entry = this.historyRepo.create({
      taskId,
      companyId,
      action,
      performedById,
      performedByType,
      performedByName,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      details: details ?? null,
    });
    await this.historyRepo.save(entry);
  }

  /** Resolve performer name */
  private async resolvePerformerName(id: number, type: 'admin' | 'employee'): Promise<string> {
    if (type === 'admin') {
      const admin = await this.adminRepo.findOne({ where: { id }, select: ['id', 'name'] });
      return admin?.name ?? 'Admin';
    }
    const emp = await this.employeeRepo.findOne({ where: { id }, select: ['id', 'empName'] });
    return emp?.empName ?? 'Employee';
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async ensureProject(projectId: number, companyId: number): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id: projectId, companyId } });
    if (!project) throw new NotFoundException(`Project #${projectId} not found`);
    return project;
  }

  private async ensureTask(taskId: number, companyId: number): Promise<ProjectTask> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, companyId },
      relations: ['assignee', 'assignedAdmin', 'phase', 'project'],
    });
    if (!task) throw new NotFoundException(`Task #${taskId} not found`);
    return task;
  }

  /** Assign ticket to admin and notify when closed */
  private async assignToAdminOnClose(task: ProjectTask, companyId: number, assignToAdminId?: number) {
    if (assignToAdminId) {
      // Assign the ticket to the selected admin and remove employee assignee
      task.assignedAdminId = assignToAdminId;
      task.assigneeId = null;
      task.assignee = null;
      await this.taskRepo.save(task);

      const admin = await this.adminRepo.findOne({ where: { id: assignToAdminId }, select: ['id', 'name'] });

      // Record assignment to admin in history
      await this.recordHistory(
        task.id, companyId, TaskHistoryAction.ASSIGNED,
        assignToAdminId, 'admin', admin?.name ?? 'Admin',
        null, admin?.name ?? 'Admin',
        `Ticket closed and assigned to admin ${admin?.name ?? 'Admin'}`,
      );
      await this.notificationsService.create(
        NotificationType.TASK_STATUS_CHANGED,
        'Ticket Closed & Assigned to You',
        `Ticket ${task.ticketNumber} "${task.title}" has been closed and assigned to you.`,
        companyId,
        { taskId: task.id, projectId: task.projectId, assignedToAdminId: assignToAdminId, assignedToAdminName: admin?.name },
      );
    } else {
      // Fallback: notify all admins without specific assignment
      await this.notificationsService.create(
        NotificationType.TASK_STATUS_CHANGED,
        'Ticket Closed',
        `Ticket ${task.ticketNumber} "${task.title}" has been closed.`,
        companyId,
        { taskId: task.id, projectId: task.projectId },
      );
    }
  }

  /** Get list of company admins for ticket assignment on close */
  async getCompanyAdmins(companyId: number) {
    return this.adminRepo.find({
      where: { companyId, isActive: true },
      select: ['id', 'name', 'email'],
      order: { name: 'ASC' },
    });
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
      .leftJoinAndSelect('t.assignedAdmin', 'assignedAdmin')
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

  async createTask(projectId: number, companyId: number, dto: CreateTaskDto, adminId?: number) {
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

    // Record creation history
    const creatorName = adminId ? await this.resolvePerformerName(adminId, 'admin') : 'Admin';
    await this.recordHistory(
      saved.id, companyId, TaskHistoryAction.CREATED,
      adminId ?? 0, 'admin', creatorName,
      null, null, `Created ticket ${ticketNumber} "${dto.title}"`,
    );

    if (saved.assigneeId) {
      let assignerName = creatorName;

      // Record assignment history
      const assigneeName = await this.resolvePerformerName(saved.assigneeId, 'employee');
      await this.recordHistory(
        saved.id, companyId, TaskHistoryAction.ASSIGNED,
        adminId ?? 0, 'admin', assignerName,
        null, assigneeName, `Assigned to ${assigneeName}`,
      );

      await this.notificationsService.create(
        NotificationType.TASK_ASSIGNED,
        'New Task Assigned',
        `${assignerName} assigned you task ${ticketNumber}`,
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
      relations: ['assignee', 'assignedAdmin', 'phase', 'project', 'comments'],
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

  async updateTask(taskId: number, companyId: number, dto: UpdateTaskDto, adminId?: number) {
    const task = await this.ensureTask(taskId, companyId);
    const prevAssignee = task.assigneeId;
    const prevAssigneeName = task.assignee?.empName ?? null;
    const prevStatus = task.status;
    const prevPriority = task.priority;

    Object.assign(task, dto);
    // Clear loaded relations when FK changes to prevent TypeORM from syncing old relation back
    if (dto.assigneeId !== undefined && dto.assigneeId !== prevAssignee) {
      task.assignee = null;
    }
    const saved = await this.taskRepo.save(task);

    const performerName = adminId ? await this.resolvePerformerName(adminId, 'admin') : 'Admin';
    const performerId = adminId ?? 0;

    // Record status change history
    if (dto.status && dto.status !== prevStatus) {
      await this.recordHistory(
        saved.id, companyId,
        dto.status === 'closed' ? TaskHistoryAction.CLOSED : TaskHistoryAction.STATUS_CHANGED,
        performerId, 'admin', performerName,
        prevStatus, saved.status,
        `Status changed from ${prevStatus} to ${saved.status}`,
      );
    }

    // Record priority change history
    if (dto.priority && dto.priority !== prevPriority) {
      await this.recordHistory(
        saved.id, companyId, TaskHistoryAction.PRIORITY_CHANGED,
        performerId, 'admin', performerName,
        prevPriority, saved.priority,
        `Priority changed from ${prevPriority} to ${saved.priority}`,
      );
    }

    // Record reassignment history
    if (dto.assigneeId && dto.assigneeId !== prevAssignee) {
      const newAssigneeName = await this.resolvePerformerName(dto.assigneeId, 'employee');
      await this.recordHistory(
        saved.id, companyId, TaskHistoryAction.REASSIGNED,
        performerId, 'admin', performerName,
        prevAssigneeName, newAssigneeName,
        `Reassigned from ${prevAssigneeName ?? 'Unassigned'} to ${newAssigneeName}`,
      );

      await this.notificationsService.create(
        NotificationType.TASK_ASSIGNED,
        'Task Assigned',
        `${performerName} assigned you task ${saved.ticketNumber}`,
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

    // Notify admins when ticket is closed
    if (dto.status === 'closed' && prevStatus !== 'closed') {
      await this.assignToAdminOnClose(saved, companyId);
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

  async getMyTasksSummary(employeeId: number, companyId: number) {
    const qb = this.taskRepo
      .createQueryBuilder('t')
      .where('t.assignee_id = :employeeId AND t.company_id = :companyId', { employeeId, companyId });

    const byStatus = await qb.clone()
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.status')
      .getRawMany();

    const byPriority = await qb.clone()
      .select('t.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.priority')
      .getRawMany();

    const totalTasks = byStatus.reduce((sum, r) => sum + Number(r.count), 0);
    const todoCount = Number(byStatus.find((r) => r.status === 'todo')?.count ?? 0);
    const inProgressCount = Number(byStatus.find((r) => r.status === 'in_progress')?.count ?? 0);
    const inReviewCount = Number(byStatus.find((r) => r.status === 'in_review')?.count ?? 0);
    const doneCount = Number(byStatus.find((r) => r.status === 'done')?.count ?? 0);
    const closedCount = Number(byStatus.find((r) => r.status === 'closed')?.count ?? 0);

    return {
      totalTasks,
      todoCount,
      inProgressCount,
      inReviewCount,
      doneCount,
      closedCount,
      byStatus,
      byPriority,
    };
  }

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

    // Record history
    const empName = await this.resolvePerformerName(employeeId, 'employee');
    await this.recordHistory(
      saved.id, companyId,
      dto.status === 'closed' ? TaskHistoryAction.CLOSED : TaskHistoryAction.STATUS_CHANGED,
      employeeId, 'employee', empName,
      prevStatus, saved.status,
      `Status changed from ${prevStatus} to ${saved.status}`,
    );

    await this.notificationsService.create(
      NotificationType.TASK_STATUS_CHANGED,
      'Task Status Updated',
      `Task "${saved.title}" in "${task.project.projectName}" changed from ${prevStatus} to ${saved.status}.`,
      companyId,
      { taskId: saved.id, projectId: saved.projectId, updatedBy: employeeId },
    );

    // Notify admins when ticket is closed
    if (dto.status === 'closed' && prevStatus !== 'closed') {
      await this.assignToAdminOnClose(saved, companyId, dto.assignToAdminId);
    }

    return saved;
  }

  async reassignTask(taskId: number, employeeId: number, companyId: number, newAssigneeId: number) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, companyId, assigneeId: employeeId },
      relations: ['project', 'assignee'],
    });
    if (!task) throw new ForbiddenException('Task not found or not assigned to you');

    const newAssignee = await this.employeeRepo.findOne({
      where: { id: newAssigneeId, companyId, isActive: true },
    });
    if (!newAssignee) throw new NotFoundException(`Employee #${newAssigneeId} not found`);

    const currentEmployee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      select: ['id', 'empName'],
    });

    const prevAssigneeName = task.assignee?.empName ?? 'Unassigned';
    task.assigneeId = newAssigneeId;
    task.assignee = null;
    const saved = await this.taskRepo.save(task);

    // Record history
    await this.recordHistory(
      saved.id, companyId, TaskHistoryAction.REASSIGNED,
      employeeId, 'employee', currentEmployee?.empName ?? 'Employee',
      prevAssigneeName, newAssignee.empName,
      `Reassigned from ${prevAssigneeName} to ${newAssignee.empName}`,
    );

    // Notify the new assignee (skip if assigning to self)
    if (newAssigneeId !== employeeId) {
      await this.notificationsService.create(
        NotificationType.TASK_ASSIGNED,
        'Task Reassigned',
        `${currentEmployee?.empName ?? 'A colleague'} assigned you task ${saved.ticketNumber}`,
        companyId,
        { taskId: saved.id, projectId: saved.projectId },
        newAssigneeId,
      );
    }

    return saved;
  }

  // ── Admin: All Tickets ─────────────────────────────────────────────────────

  async getAllCompanyTickets(companyId: number, filter: FilterTasksDto) {
    const { page = 1, limit = 50, sort = 'createdAt', order = 'desc', search, status, priority, projectId } = filter;

    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.project', 'project')
      .leftJoinAndSelect('t.phase', 'phase')
      .leftJoinAndSelect('t.assignee', 'assignee')
      .leftJoinAndSelect('t.assignedAdmin', 'assignedAdmin')
      .where('t.company_id = :companyId', { companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`t.${sort === 'sortOrder' ? 'sortOrder' : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (search) qb.andWhere('t.ticket_number LIKE :s', { s: `%${search}%` });
    if (status) qb.andWhere('t.status = :status', { status });
    if (priority) qb.andWhere('t.priority = :priority', { priority });
    if (projectId) qb.andWhere('t.project_id = :projectId', { projectId });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getAllCompanyProjects(companyId: number) {
    return this.projectRepo.find({
      where: { companyId },
      select: ['id', 'projectName', 'projectCode'],
      order: { projectName: 'ASC' },
    });
  }

  async adminUpdateTaskStatus(taskId: number, companyId: number, dto: UpdateTaskStatusDto, adminId?: number) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, companyId },
      relations: ['project'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const prevStatus = task.status;
    task.status = dto.status;
    const saved = await this.taskRepo.save(task);

    // Record history
    const performerName = adminId ? await this.resolvePerformerName(adminId, 'admin') : 'Admin';
    await this.recordHistory(
      saved.id, companyId,
      dto.status === 'closed' ? TaskHistoryAction.CLOSED : TaskHistoryAction.STATUS_CHANGED,
      adminId ?? 0, 'admin', performerName,
      prevStatus, saved.status,
      `Status changed from ${prevStatus} to ${saved.status}`,
    );

    if (saved.assigneeId) {
      await this.notificationsService.create(
        NotificationType.TASK_STATUS_CHANGED,
        'Task Status Updated',
        `Task "${saved.title}" in "${task.project.projectName}" changed from ${prevStatus} to ${saved.status}.`,
        companyId,
        { taskId: saved.id, projectId: saved.projectId },
        saved.assigneeId,
      );
    }

    // Notify admins when ticket is closed
    if (dto.status === 'closed' && prevStatus !== 'closed') {
      await this.assignToAdminOnClose(saved, companyId, dto.assignToAdminId);
    }

    return saved;
  }

  async adminReassignTask(taskId: number, companyId: number, newAssigneeId: number, adminId?: number) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, companyId },
      relations: ['project', 'assignee'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const newAssignee = await this.employeeRepo.findOne({
      where: { id: newAssigneeId, companyId, isActive: true },
    });
    if (!newAssignee) throw new NotFoundException(`Employee #${newAssigneeId} not found`);

    let assignerName = 'Admin';
    if (adminId) {
      const admin = await this.adminRepo.findOne({ where: { id: adminId }, select: ['id', 'name'] });
      if (admin) assignerName = admin.name;
    }

    const prevAssigneeName = task.assignee?.empName ?? 'Unassigned';
    task.assigneeId = newAssigneeId;
    task.assignee = null;
    const saved = await this.taskRepo.save(task);

    // Record history
    await this.recordHistory(
      saved.id, companyId, TaskHistoryAction.REASSIGNED,
      adminId ?? 0, 'admin', assignerName,
      prevAssigneeName, newAssignee.empName,
      `Reassigned from ${prevAssigneeName} to ${newAssignee.empName}`,
    );

    await this.notificationsService.create(
      NotificationType.TASK_ASSIGNED,
      'Task Reassigned',
      `${assignerName} assigned you task ${saved.ticketNumber}`,
      companyId,
      { taskId: saved.id, projectId: saved.projectId },
      newAssigneeId,
    );

    return saved;
  }

  // ── Employee: All Project Tickets ───────────────────────────────────────────

  private isElevatedRole(emp: Employee | null): boolean {
    if (!emp) return false;
    return emp.isHr || emp.consultantType === 'management' || emp.consultantType === 'project_manager';
  }

  async getAccessibleProjects(employeeId: number, companyId: number) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, companyId },
      select: ['id', 'assignedProjectId', 'isHr', 'consultantType'],
    });

    const isAdminOrHr = this.isElevatedRole(employee);

    if (isAdminOrHr) {
      // Return all company projects
      return this.projectRepo.find({
        where: { companyId },
        select: ['id', 'projectName', 'projectCode'],
        order: { projectName: 'ASC' },
      });
    }

    // Regular employees: only projects where they have tickets or are assigned
    const taskProjects = await this.taskRepo
      .createQueryBuilder('t')
      .select('DISTINCT t.project_id', 'projectId')
      .where('t.assignee_id = :employeeId AND t.company_id = :companyId', { employeeId, companyId })
      .getRawMany();

    const projectIds = new Set<number>(taskProjects.map((r) => Number(r.projectId)));
    if (employee?.assignedProjectId) projectIds.add(employee.assignedProjectId);

    if (projectIds.size === 0) return [];

    return this.projectRepo.find({
      where: { id: In([...projectIds]) },
      select: ['id', 'projectName', 'projectCode'],
      order: { projectName: 'ASC' },
    });
  }

  async getProjectTickets(employeeId: number, companyId: number, filter: FilterTasksDto) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, companyId },
      select: ['id', 'assignedProjectId', 'isHr', 'consultantType'],
    });

    // HR, Management, and Project Manager employees see ALL company tickets
    const isAdminOrHr = this.isElevatedRole(employee);

    let projectIds: number[] | null = null; // null means all projects

    if (!isAdminOrHr) {
      // Regular employees: only projects where they have tickets
      const taskProjects = await this.taskRepo
        .createQueryBuilder('t')
        .select('DISTINCT t.project_id', 'projectId')
        .where('t.assignee_id = :employeeId AND t.company_id = :companyId', { employeeId, companyId })
        .getRawMany();

      const ids = new Set<number>(taskProjects.map((r) => Number(r.projectId)));
      if (employee?.assignedProjectId) ids.add(employee.assignedProjectId);

      if (ids.size === 0) {
        return { data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      }
      projectIds = [...ids];
    }

    const { page = 1, limit = 50, sort = 'createdAt', order = 'desc', search, status, priority, projectId } = filter;

    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.project', 'project')
      .leftJoinAndSelect('t.phase', 'phase')
      .leftJoinAndSelect('t.assignee', 'assignee')
      .leftJoinAndSelect('t.assignedAdmin', 'assignedAdmin')
      .where('t.company_id = :companyId', { companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`t.${sort === 'sortOrder' ? 'sortOrder' : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    // Only filter by project IDs for non-admin/non-HR employees
    if (projectIds) {
      qb.andWhere('t.project_id IN (:...projectIds)', { projectIds });
    }

    if (search) qb.andWhere('t.ticket_number LIKE :s', { s: `%${search}%` });
    if (status) qb.andWhere('t.status = :status', { status });
    if (priority) qb.andWhere('t.priority = :priority', { priority });
    if (projectId) qb.andWhere('t.project_id = :projectId', { projectId });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateProjectTaskStatus(taskId: number, employeeId: number, companyId: number, dto: UpdateTaskStatusDto) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, companyId },
      relations: ['project'],
    });
    if (!task) throw new NotFoundException('Task not found');

    // Verify employee belongs to this project
    const isMember = await this.isProjectMember(employeeId, companyId, task.projectId);
    if (!isMember) throw new ForbiddenException('You are not a member of this project');

    const prevStatus = task.status;
    task.status = dto.status;
    const saved = await this.taskRepo.save(task);

    // Record history
    const empName = await this.resolvePerformerName(employeeId, 'employee');
    await this.recordHistory(
      saved.id, companyId,
      dto.status === 'closed' ? TaskHistoryAction.CLOSED : TaskHistoryAction.STATUS_CHANGED,
      employeeId, 'employee', empName,
      prevStatus, saved.status,
      `Status changed from ${prevStatus} to ${saved.status}`,
    );

    // Notify assignee only if someone else updated the status
    if (saved.assigneeId && saved.assigneeId !== employeeId) {
      await this.notificationsService.create(
        NotificationType.TASK_STATUS_CHANGED,
        'Task Status Updated',
        `Task "${saved.title}" in "${task.project.projectName}" changed from ${prevStatus} to ${saved.status}.`,
        companyId,
        { taskId: saved.id, projectId: saved.projectId, updatedBy: employeeId },
        saved.assigneeId,
      );
    }

    // Notify admins when ticket is closed
    if (dto.status === 'closed' && prevStatus !== 'closed') {
      await this.assignToAdminOnClose(saved, companyId, dto.assignToAdminId);
    }

    return saved;
  }

  async reassignProjectTask(taskId: number, employeeId: number, companyId: number, newAssigneeId: number) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, companyId },
      relations: ['project', 'assignee'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const isMember = await this.isProjectMember(employeeId, companyId, task.projectId);
    if (!isMember) throw new ForbiddenException('You are not a member of this project');

    const newAssignee = await this.employeeRepo.findOne({
      where: { id: newAssigneeId, companyId, isActive: true },
    });
    if (!newAssignee) throw new NotFoundException(`Employee #${newAssigneeId} not found`);

    const currentEmployee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      select: ['id', 'empName'],
    });

    const prevAssigneeName = task.assignee?.empName ?? 'Unassigned';
    task.assigneeId = newAssigneeId;
    task.assignee = null;
    const saved = await this.taskRepo.save(task);

    // Record history
    await this.recordHistory(
      saved.id, companyId, TaskHistoryAction.REASSIGNED,
      employeeId, 'employee', currentEmployee?.empName ?? 'Employee',
      prevAssigneeName, newAssignee.empName,
      `Reassigned from ${prevAssigneeName} to ${newAssignee.empName}`,
    );

    // Notify the new assignee (skip if assigning to self)
    if (newAssigneeId !== employeeId) {
      await this.notificationsService.create(
        NotificationType.TASK_ASSIGNED,
        'Task Reassigned',
        `${currentEmployee?.empName ?? 'A colleague'} assigned you task ${saved.ticketNumber}`,
        companyId,
        { taskId: saved.id, projectId: saved.projectId },
        newAssigneeId,
      );
    }

    return saved;
  }

  private async isProjectMember(employeeId: number, companyId: number, projectId: number): Promise<boolean> {
    const emp = await this.employeeRepo.findOne({
      where: { id: employeeId, companyId },
      select: ['id', 'assignedProjectId', 'isHr', 'consultantType'],
    });

    // HR, Management, and Project Manager employees have access to all projects
    if (this.isElevatedRole(emp)) return true;

    // Check if employee is assigned to this project
    if (emp?.assignedProjectId === projectId) return true;

    // Check if employee has any task in this project
    const taskCount = await this.taskRepo.count({
      where: { assigneeId: employeeId, companyId, projectId },
    });
    return taskCount > 0;
  }

  // ── Task History ─────────────────────────────────────────────────────────────

  async getTaskHistory(taskId: number, companyId: number) {
    const task = await this.taskRepo.findOne({ where: { id: taskId, companyId } });
    if (!task) throw new NotFoundException(`Task #${taskId} not found`);

    return this.historyRepo.find({
      where: { taskId, companyId },
      order: { createdAt: 'ASC' },
    });
  }

  // ── Autocomplete suggestions ────────────────────────────────────────────────

  async autocompleteTickets(query: string, companyId: number) {
    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.project', 'project')
      .leftJoinAndSelect('t.assignee', 'assignee')
      .leftJoinAndSelect('t.assignedAdmin', 'assignedAdmin')
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
      relations: ['assignee', 'assignedAdmin', 'phase', 'project', 'comments'],
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
