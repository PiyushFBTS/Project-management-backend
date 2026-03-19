import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest, LeaveRequestStatus } from '../database/entities/leave-request.entity';
import { LeaveRequestWatcher } from '../database/entities/leave-request-watcher.entity';
import { LeaveType } from '../database/entities/leave-reason.entity';
import { Employee } from '../database/entities/employee.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../database/entities/notification.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ActionLeaveRequestDto } from './dto/action-leave-request.dto';
import { FilterLeaveRequestDto } from './dto/filter-leave-request.dto';

const SORTABLE = ['id', 'dateFrom', 'dateTo', 'totalDays', 'status', 'createdAt'];

// Statuses that HR can act on (override at any level)
const HR_ACTIONABLE = [
  LeaveRequestStatus.PENDING,
  LeaveRequestStatus.MANAGER_APPROVED,
];

// Statuses where a request is still cancellable
const CANCELLABLE = [
  LeaveRequestStatus.PENDING,
  LeaveRequestStatus.MANAGER_APPROVED,
];

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepo: Repository<LeaveRequest>,
    @InjectRepository(LeaveRequestWatcher)
    private readonly watcherRepo: Repository<LeaveRequestWatcher>,
    @InjectRepository(LeaveType)
    private readonly leaveTypeRepo: Repository<LeaveType>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Employee: submit leave request ──────────────────────────────────────────

  async submit(employee: Employee, dto: CreateLeaveRequestDto) {
    // Validate employee has a reporting manager
    if (!employee.reportsToId) {
      throw new BadRequestException('You do not have a reporting manager configured. Please contact admin.');
    }

    // Validate leave type exists and is active
    const leaveType = await this.leaveTypeRepo.findOne({
      where: { id: dto.leaveReasonId, companyId: employee.companyId, isActive: true },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found or inactive');

    // Validate dates
    if (dto.dateTo < dto.dateFrom) {
      throw new BadRequestException('"Date To" must be on or after "Date From"');
    }

    // Check for overlapping leave requests (exclude all terminal statuses)
    const EXCLUDED_FOR_OVERLAP = [
      LeaveRequestStatus.MANAGER_REJECTED,
      LeaveRequestStatus.HR_REJECTED,
      LeaveRequestStatus.CANCELLED,
    ];
    const overlap = await this.leaveRequestRepo
      .createQueryBuilder('lr')
      .where('lr.employeeId = :eid', { eid: employee.id })
      .andWhere('lr.companyId = :cid', { cid: employee.companyId })
      .andWhere('lr.status NOT IN (:...excluded)', { excluded: EXCLUDED_FOR_OVERLAP })
      .andWhere('lr.dateFrom <= :to AND lr.dateTo >= :from', { from: dto.dateFrom, to: dto.dateTo })
      .getOne();

    if (overlap) {
      throw new BadRequestException('You already have a leave request that overlaps with these dates');
    }

    // Create the leave request
    const lr = this.leaveRequestRepo.create({
      employeeId: employee.id,
      leaveReasonId: dto.leaveReasonId,
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      remarks: dto.remarks ?? null,
      status: LeaveRequestStatus.PENDING,
      managerId: employee.reportsToId,
      companyId: employee.companyId,
    });
    const saved = await this.leaveRequestRepo.save(lr);

    // Create watchers
    if (dto.watcherIds?.length) {
      const uniqueIds = [...new Set(dto.watcherIds)].filter((id) => id !== employee.id);
      const watchers = uniqueIds.map((eid) =>
        this.watcherRepo.create({ leaveRequestId: saved.id, employeeId: eid, companyId: employee.companyId }),
      );
      await this.watcherRepo.save(watchers);
    }

    // Notify RM
    await this.notificationsService.create(
      NotificationType.LEAVE_REQUEST_SUBMITTED,
      'Leave Request Submitted',
      `${employee.empName} has submitted a leave request from ${dto.dateFrom} to ${dto.dateTo}.`,
      employee.companyId,
      { leaveRequestId: saved.id, employeeId: employee.id },
      employee.reportsToId,
    );

    return this.findOneInternal(saved.id, employee.companyId);
  }

  // ── Admin: submit leave request ─────────────────────────────────────────────

  async submitAdminLeave(adminId: number, companyId: number, dto: CreateLeaveRequestDto) {
    const leaveType = await this.leaveTypeRepo.findOne({
      where: { id: dto.leaveReasonId, companyId, isActive: true },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found or inactive');

    if (dto.dateTo < dto.dateFrom) {
      throw new BadRequestException('"Date To" must be on or after "Date From"');
    }

    const EXCLUDED_FOR_OVERLAP = [
      LeaveRequestStatus.MANAGER_REJECTED,
      LeaveRequestStatus.HR_REJECTED,
      LeaveRequestStatus.CANCELLED,
    ];
    const overlap = await this.leaveRequestRepo
      .createQueryBuilder('lr')
      .where('lr.adminId = :aid', { aid: adminId })
      .andWhere('lr.companyId = :cid', { cid: companyId })
      .andWhere('lr.status NOT IN (:...excluded)', { excluded: EXCLUDED_FOR_OVERLAP })
      .andWhere('lr.dateFrom <= :to AND lr.dateTo >= :from', { from: dto.dateFrom, to: dto.dateTo })
      .getOne();

    if (overlap) {
      throw new BadRequestException('You already have a leave request that overlaps with these dates');
    }

    const lr = this.leaveRequestRepo.create({
      adminId,
      employeeId: null,
      leaveReasonId: dto.leaveReasonId,
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      remarks: dto.remarks ?? null,
      status: LeaveRequestStatus.PENDING,
      managerId: null,
      companyId,
    });
    const saved = await this.leaveRequestRepo.save(lr);

    if (dto.watcherIds?.length) {
      const watchers = [...new Set(dto.watcherIds)].map((eid) =>
        this.watcherRepo.create({ leaveRequestId: saved.id, employeeId: eid, companyId }),
      );
      await this.watcherRepo.save(watchers);
    }

    return this.findOneInternal(saved.id, companyId);
  }

  // ── Employee: my leave history ──────────────────────────────────────────────

  async findMyLeaves(employeeId: number, companyId: number, filter: FilterLeaveRequestDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', status, dateFrom, dateTo } = filter;

    const qb = this.leaveRequestRepo
      .createQueryBuilder('lr')
      .leftJoinAndSelect('lr.leaveReason', 'reason')
      .leftJoin('lr.manager', 'mgr')
      .addSelect(['mgr.id', 'mgr.empName', 'mgr.empCode'])
      .leftJoin('lr.hr', 'hr')
      .addSelect(['hr.id', 'hr.empName', 'hr.empCode'])
      .where('lr.employeeId = :employeeId', { employeeId })
      .andWhere('lr.companyId = :companyId', { companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`lr.${SORTABLE.includes(sort) ? sort : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (status) qb.andWhere('lr.status = :status', { status });
    if (dateFrom) qb.andWhere('lr.dateFrom >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('lr.dateTo <= :dateTo', { dateTo });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Employee: pending approvals (for PM, RM, and HR) ────────────────────────

  async findPendingApprovals(employee: Employee, filter: FilterLeaveRequestDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = filter;

    const qb = this.leaveRequestRepo
      .createQueryBuilder('lr')
      .leftJoinAndSelect('lr.leaveReason', 'reason')
      .leftJoin('lr.employee', 'emp')
      .addSelect(['emp.id', 'emp.empName', 'emp.empCode'])
      .leftJoin('lr.manager', 'mgr')
      .addSelect(['mgr.id', 'mgr.empName', 'mgr.empCode'])
      .where('lr.companyId = :companyId', { companyId: employee.companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`lr.${SORTABLE.includes(sort) ? sort : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (employee.isHr) {
      // HR sees everything in HR_ACTIONABLE states
      qb.andWhere('lr.status IN (:...statuses)', { statuses: HR_ACTIONABLE });
    } else {
      // RM sees pending requests assigned to them
      qb.andWhere('lr.managerId = :myId AND lr.status = :pending', {
        myId: employee.id,
        pending: LeaveRequestStatus.PENDING,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Employee: team leaves (for PM, RM, HR) ───────────────────────────────────

  async findTeamLeaves(employee: Employee, filter: FilterLeaveRequestDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', status, dateFrom, dateTo, employeeId } = filter;

    const qb = this.leaveRequestRepo
      .createQueryBuilder('lr')
      .leftJoinAndSelect('lr.leaveReason', 'reason')
      .leftJoin('lr.employee', 'emp')
      .addSelect(['emp.id', 'emp.empName', 'emp.empCode'])
      .leftJoin('lr.manager', 'mgr')
      .addSelect(['mgr.id', 'mgr.empName', 'mgr.empCode'])
      .leftJoin('lr.hr', 'hr')
      .addSelect(['hr.id', 'hr.empName', 'hr.empCode'])
      .where('lr.companyId = :companyId', { companyId: employee.companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`lr.${SORTABLE.includes(sort) ? sort : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (employee.isHr) {
      // HR sees all employee leaves (not admin leaves)
      qb.andWhere('lr.employeeId IS NOT NULL');
    } else {
      // RM sees leaves where they are the manager
      qb.andWhere('lr.managerId = :myId', { myId: employee.id });
    }

    if (status) qb.andWhere('lr.status = :status', { status });
    if (employeeId) qb.andWhere('lr.employeeId = :employeeId', { employeeId });
    if (dateFrom) qb.andWhere('lr.dateFrom >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('lr.dateTo <= :dateTo', { dateTo });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Employee: single leave request detail ───────────────────────────────────

  async findOneForEmployee(id: number, employee: Employee) {
    const lr = await this.findOneInternal(id, employee.companyId);

    const isOwner = lr.employeeId === employee.id;
    const isManager = lr.managerId === employee.id;
    const isHr = employee.isHr;
    const isWatcher = lr.watchers?.some((w) => w.employeeId === employee.id);

    if (!isOwner && !isManager && !isHr && !isWatcher) {
      throw new ForbiddenException('You do not have access to this leave request');
    }

    return lr;
  }

  // ── Employee: cancel own request ────────────────────────────────────────────

  async cancel(id: number, employee: Employee) {
    const lr = await this.findOneInternal(id, employee.companyId);

    if (lr.employeeId !== employee.id) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }
    if (!CANCELLABLE.includes(lr.status)) {
      throw new BadRequestException('Only pending or approved requests can be cancelled');
    }

    const notifyId = lr.managerId;
    lr.status = LeaveRequestStatus.CANCELLED;
    await this.leaveRequestRepo.save(lr);
    if (notifyId) {
      await this.notificationsService.create(
        NotificationType.LEAVE_REQUEST_CANCELLED,
        'Leave Request Cancelled',
        `${employee.empName} has cancelled their leave request (${lr.dateFrom} to ${lr.dateTo}).`,
        employee.companyId,
        { leaveRequestId: lr.id, employeeId: employee.id },
        notifyId,
      );
    }

    return this.findOneInternal(id, employee.companyId);
  }

  // ── Employee: approve ───────────────────────────────────────────────────────

  async approve(id: number, employee: Employee, dto: ActionLeaveRequestDto) {
    const lr = await this.findOneInternal(id, employee.companyId);

    // ── Level 1: RM approval ──
    if (lr.managerId === employee.id && lr.status === LeaveRequestStatus.PENDING) {
      lr.status = LeaveRequestStatus.MANAGER_APPROVED;
      lr.managerActionAt = new Date();
      lr.managerRemarks = dto.remarks ?? null;
      await this.leaveRequestRepo.save(lr);

      // Notify employee
      if (lr.employeeId) {
        await this.notificationsService.create(
          NotificationType.LEAVE_REQUEST_MANAGER_APPROVED,
          'Leave Request Approved by Manager',
          `Your leave request (${lr.dateFrom} to ${lr.dateTo}) has been approved by your Reporting Manager.`,
          employee.companyId,
          { leaveRequestId: lr.id, employeeId: lr.employeeId },
          lr.employeeId,
        );
      }

      // Notify all HR employees
      const hrEmployees = await this.employeeRepo.find({
        where: { companyId: employee.companyId, isHr: true, isActive: true },
        select: ['id'],
      });
      const empName = (await this.employeeRepo.findOne({ where: { id: lr.employeeId } }))?.empName ?? '';
      for (const hr of hrEmployees) {
        await this.notificationsService.create(
          NotificationType.LEAVE_REQUEST_MANAGER_APPROVED,
          'Leave Request Awaiting HR Approval',
          `${empName}'s leave request (${lr.dateFrom} to ${lr.dateTo}) has been approved by manager and needs HR approval.`,
          employee.companyId,
          { leaveRequestId: lr.id, employeeId: lr.employeeId },
          hr.id,
        );
      }

      return this.findOneInternal(id, employee.companyId);
    }

    // ── Level 2: HR approval (override at any level) ──
    if (employee.isHr && HR_ACTIONABLE.includes(lr.status)) {
      lr.status = LeaveRequestStatus.HR_APPROVED;
      lr.hrId = employee.id;
      lr.hrActionAt = new Date();
      lr.hrRemarks = dto.remarks ?? null;
      await this.leaveRequestRepo.save(lr);

      const approvedEmp = lr.employeeId
        ? await this.employeeRepo.findOne({ where: { id: lr.employeeId } })
        : null;

      if (lr.employeeId) {
        await this.notificationsService.create(
          NotificationType.LEAVE_REQUEST_HR_APPROVED,
          'Leave Request Fully Approved',
          `Your leave request (${lr.dateFrom} to ${lr.dateTo}) has been fully approved by HR.`,
          employee.companyId,
          { leaveRequestId: lr.id, employeeId: lr.employeeId },
          lr.employeeId,
        );
      }
      if (lr.managerId) {
        await this.notificationsService.create(
          NotificationType.LEAVE_REQUEST_HR_APPROVED,
          'Leave Request Fully Approved',
          `Leave request (${lr.dateFrom} to ${lr.dateTo}) for ${approvedEmp?.empName} has been fully approved by HR.`,
          employee.companyId,
          { leaveRequestId: lr.id, employeeId: lr.employeeId },
          lr.managerId,
        );
      }

      return this.findOneInternal(id, employee.companyId);
    }

    throw new ForbiddenException('You are not authorized to approve this request in its current state');
  }

  // ── Employee: reject ────────────────────────────────────────────────────────

  async reject(id: number, employee: Employee, dto: ActionLeaveRequestDto) {
    const lr = await this.findOneInternal(id, employee.companyId);

    // ── Level 1: RM rejection ──
    if (lr.managerId === employee.id && lr.status === LeaveRequestStatus.PENDING) {
      lr.status = LeaveRequestStatus.MANAGER_REJECTED;
      lr.managerActionAt = new Date();
      lr.managerRemarks = dto.remarks ?? null;
      await this.leaveRequestRepo.save(lr);

      if (lr.employeeId) {
        await this.notificationsService.create(
          NotificationType.LEAVE_REQUEST_MANAGER_REJECTED,
          'Leave Request Rejected by Manager',
          `Your leave request (${lr.dateFrom} to ${lr.dateTo}) has been rejected by your Reporting Manager.`,
          employee.companyId,
          { leaveRequestId: lr.id, employeeId: lr.employeeId },
          lr.employeeId,
        );
      }
      return this.findOneInternal(id, employee.companyId);
    }

    // ── Level 2: HR rejection (override at any level) ──
    if (employee.isHr && HR_ACTIONABLE.includes(lr.status)) {
      lr.status = LeaveRequestStatus.HR_REJECTED;
      lr.hrId = employee.id;
      lr.hrActionAt = new Date();
      lr.hrRemarks = dto.remarks ?? null;
      await this.leaveRequestRepo.save(lr);

      const rejectedEmp = lr.employeeId
        ? await this.employeeRepo.findOne({ where: { id: lr.employeeId } })
        : null;

      if (lr.employeeId) {
        await this.notificationsService.create(
          NotificationType.LEAVE_REQUEST_HR_REJECTED,
          'Leave Request Rejected by HR',
          `Your leave request (${lr.dateFrom} to ${lr.dateTo}) has been rejected by HR.`,
          employee.companyId,
          { leaveRequestId: lr.id, employeeId: lr.employeeId },
          lr.employeeId,
        );
      }
      if (lr.managerId) {
        await this.notificationsService.create(
          NotificationType.LEAVE_REQUEST_HR_REJECTED,
          'Leave Request Rejected by HR',
          `Leave request (${lr.dateFrom} to ${lr.dateTo}) for ${rejectedEmp?.empName} has been rejected by HR.`,
          employee.companyId,
          { leaveRequestId: lr.id, employeeId: lr.employeeId },
          lr.managerId,
        );
      }

      return this.findOneInternal(id, employee.companyId);
    }

    throw new ForbiddenException('You are not authorized to reject this request in its current state');
  }

  // ── Admin: cancel a leave request ──────────────────────────────────────────

  async adminCancel(id: number, companyId: number) {
    const lr = await this.findOneInternal(id, companyId);

    if (!CANCELLABLE.includes(lr.status)) {
      throw new BadRequestException('Only pending or approved requests can be cancelled');
    }

    lr.status = LeaveRequestStatus.CANCELLED;
    await this.leaveRequestRepo.save(lr);
    return this.findOneInternal(id, companyId);
  }

  // ── Admin: approve a leave request ────────────────────────────────────────

  async adminApprove(id: number, companyId: number, dto: ActionLeaveRequestDto) {
    const lr = await this.findOneInternal(id, companyId);

    if (lr.status === LeaveRequestStatus.PENDING) {
      lr.status = LeaveRequestStatus.MANAGER_APPROVED;
      lr.managerActionAt = new Date();
      lr.managerRemarks = dto.remarks ?? null;
      await this.leaveRequestRepo.save(lr);
      return this.findOneInternal(id, companyId);
    }

    if (lr.status === LeaveRequestStatus.MANAGER_APPROVED) {
      lr.status = LeaveRequestStatus.HR_APPROVED;
      lr.hrActionAt = new Date();
      lr.hrRemarks = dto.remarks ?? null;
      await this.leaveRequestRepo.save(lr);
      return this.findOneInternal(id, companyId);
    }

    throw new BadRequestException('This request cannot be approved in its current state');
  }

  // ── Admin: reject a leave request ─────────────────────────────────────────

  async adminReject(id: number, companyId: number, dto: ActionLeaveRequestDto) {
    const lr = await this.findOneInternal(id, companyId);

    if (lr.status === LeaveRequestStatus.PENDING) {
      lr.status = LeaveRequestStatus.MANAGER_REJECTED;
      lr.managerActionAt = new Date();
      lr.managerRemarks = dto.remarks ?? null;
      await this.leaveRequestRepo.save(lr);
      return this.findOneInternal(id, companyId);
    }

    if (lr.status === LeaveRequestStatus.MANAGER_APPROVED) {
      lr.status = LeaveRequestStatus.HR_REJECTED;
      lr.hrActionAt = new Date();
      lr.hrRemarks = dto.remarks ?? null;
      await this.leaveRequestRepo.save(lr);
      return this.findOneInternal(id, companyId);
    }

    throw new BadRequestException('This request cannot be rejected in its current state');
  }

  // ── Admin: list all company leave requests ──────────────────────────────────

  async findAll(companyId: number, filter: FilterLeaveRequestDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', status, employeeId, search, dateFrom, dateTo } = filter;

    const qb = this.leaveRequestRepo
      .createQueryBuilder('lr')
      .leftJoinAndSelect('lr.leaveReason', 'reason')
      .leftJoin('lr.employee', 'emp')
      .addSelect(['emp.id', 'emp.empName', 'emp.empCode'])
      .leftJoin('lr.manager', 'mgr')
      .addSelect(['mgr.id', 'mgr.empName', 'mgr.empCode'])
      .leftJoin('lr.hr', 'hr')
      .addSelect(['hr.id', 'hr.empName', 'hr.empCode'])
      .where('lr.companyId = :companyId', { companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`lr.${SORTABLE.includes(sort) ? sort : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (status) qb.andWhere('lr.status = :status', { status });
    if (employeeId) qb.andWhere('lr.employeeId = :employeeId', { employeeId });
    if (search) qb.andWhere('(emp.empName LIKE :s OR emp.empCode LIKE :s)', { s: `%${search}%` });
    if (dateFrom) qb.andWhere('lr.dateFrom >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('lr.dateTo <= :dateTo', { dateTo });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Admin: single leave request detail ──────────────────────────────────────

  async findOneAdmin(id: number, companyId: number) {
    return this.findOneInternal(id, companyId);
  }

  // ── Admin: leave report ─────────────────────────────────────────────────────

  async getReport(companyId: number, dateFrom?: string, dateTo?: string) {
    const qb = this.leaveRequestRepo
      .createQueryBuilder('lr')
      .leftJoin('lr.employee', 'emp')
      .leftJoin('lr.leaveReason', 'reason')
      .select('emp.id', 'employee_id')
      .addSelect('emp.emp_name', 'emp_name')
      .addSelect('emp.emp_code', 'emp_code')
      .addSelect('reason.reason_name', 'reason_name')
      .addSelect('lr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(lr.total_days)', 'total_days')
      .where('lr.companyId = :companyId', { companyId })
      .groupBy('emp.id')
      .addGroupBy('reason.reason_name')
      .addGroupBy('lr.status')
      .orderBy('emp.emp_name', 'ASC');

    if (dateFrom) qb.andWhere('lr.dateFrom >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('lr.dateTo <= :dateTo', { dateTo });

    return qb.getRawMany();
  }

  // ── Employee: get active leave types (for dropdown) ─────────────────────────

  async getActiveLeaveTypes(companyId: number) {
    return this.leaveTypeRepo.find({
      where: { companyId, isActive: true },
      select: ['id', 'reasonCode', 'reasonName'],
      order: { reasonName: 'ASC' },
    });
  }

  // ── Employee: get colleagues list (for watcher selection) ───────────────────

  async getColleagues(employeeId: number, companyId: number) {
    return this.employeeRepo.find({
      where: { companyId, isActive: true },
      select: ['id', 'empCode', 'empName'],
      order: { empName: 'ASC' },
    });
  }

  // ── Internal helper ─────────────────────────────────────────────────────────

  private async findOneInternal(id: number, companyId: number): Promise<LeaveRequest> {
    const lr = await this.leaveRequestRepo.findOne({
      where: { id, companyId },
      relations: ['leaveReason', 'employee', 'admin', 'manager', 'hr', 'watchers', 'watchers.employee'],
    });
    if (!lr) throw new NotFoundException(`Leave request #${id} not found`);
    return lr;
  }
}
