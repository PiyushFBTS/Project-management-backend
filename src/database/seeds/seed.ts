/**
 * Database seed script — creates default company, super admin, and sample data.
 *
 * Run with: npm run db:seed
 *
 * Default credentials (CHANGE in production):
 *   Super Admin:  admin@itpm.com / Admin@123
 *   Company Admin: admin@acme.com / Admin@123
 *   Employees:     <empCode>@acme.com / Emp@1234
 */
import 'reflect-metadata';
import { config } from 'dotenv';
config();

import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { Company, SubscriptionPlan } from '../entities/company.entity';
import { AdminUser, AdminRole } from '../entities/admin-user.entity';
import { Project, ProjectType, ProjectStatus } from '../entities/project.entity';
import { TaskType, TaskCategory } from '../entities/task-type.entity';
import { Employee, ConsultantType } from '../entities/employee.entity';
import { DailyTaskSheet } from '../entities/daily-task-sheet.entity';
import { TaskEntry, TaskStatus } from '../entities/task-entry.entity';
import { Notification, NotificationType } from '../entities/notification.entity';
import { LeaveType } from '../entities/leave-reason.entity';
import { LeaveRequest, LeaveRequestStatus } from '../entities/leave-request.entity';

const BCRYPT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns an array of weekday dates (Mon–Fri) going back `count` weekdays from today. */
function getRecentWeekdays(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  while (dates.length < count) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().slice(0, 10));
    }
  }
  return dates;
}

/** Pad number to HH:MM:SS */
function timeStr(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.\n');

  const defaultCompany = await seedDefaultCompany();
  await seedAdminUsers(defaultCompany.id);
  const projects = await seedProjects(defaultCompany.id);
  const taskTypes = await seedTaskTypes(defaultCompany.id);
  const employees = await seedEmployees(defaultCompany.id, projects);
  await seedEmployeeHierarchy(employees);
  const leaveTypes = await seedLeaveTypes(defaultCompany.id);
  await seedLeaveRequests(defaultCompany.id, employees, leaveTypes);
  await seedTaskSheets(defaultCompany.id, employees, projects, taskTypes);
  await seedNotifications(defaultCompany.id);

  await AppDataSource.destroy();
  console.log('\nSeeding complete.');
}

// ── Companies ─────────────────────────────────────────────────────────────────

async function seedDefaultCompany(): Promise<Company> {
  const repo = AppDataSource.getRepository(Company);

  const existing = await repo.findOne({ where: { slug: 'default' } });
  if (existing) {
    console.log(`[Company] Already exists: ${existing.name} (slug: default)`);
    return existing;
  }

  const company = await repo.save(
    repo.create({
      name: 'Default Company',
      slug: 'default',
      licenseExpiryDate: '2099-12-31',
      isActive: true,
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      userLimit: 999,
    }),
  );
  console.log(`[Company] Created: ${company.name} (id: ${company.id})`);
  return company;
}

// ── Admin users ───────────────────────────────────────────────────────────────

async function seedAdminUsers(companyId: number) {
  const repo = AppDataSource.getRepository(AdminUser);

  const users = [
    {
      name: 'Super Admin',
      email: 'admin@itpm.com',
      password: 'Admin@123',
      role: AdminRole.SUPER_ADMIN,
      companyId: null as number | null,
    },
    {
      name: 'Rahul Sharma',
      email: 'admin@acme.com',
      password: 'Admin@123',
      role: AdminRole.ADMIN,
      companyId,
    },
  ];

  for (const u of users) {
    const existing = await repo.findOne({ where: { email: u.email } });
    if (existing) {
      console.log(`[AdminUser] Already exists: ${u.email}`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    await repo.save(
      repo.create({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: true,
        companyId: u.companyId,
      }),
    );
    console.log(`[AdminUser] Created: ${u.email}  (password: ${u.password})`);
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────

async function seedProjects(companyId: number): Promise<Project[]> {
  const repo = AppDataSource.getRepository(Project);

  const projectDefs = [
    {
      projectCode: 'PRJ-001',
      projectName: 'ERP Implementation',
      projectType: ProjectType.PROJECT,
      status: ProjectStatus.ACTIVE,
      description: 'Full ERP system implementation for client A',
      companyId,
    },
    {
      projectCode: 'SUP-001',
      projectName: 'Production Support',
      projectType: ProjectType.SUPPORT,
      status: ProjectStatus.ACTIVE,
      description: 'Ongoing production support and maintenance',
      companyId,
    },
    {
      projectCode: 'PRJ-002',
      projectName: 'CRM Migration',
      projectType: ProjectType.PROJECT,
      status: ProjectStatus.ACTIVE,
      description: 'Salesforce to in-house CRM migration project',
      companyId,
    },
    {
      projectCode: 'PRJ-003',
      projectName: 'Mobile App Development',
      projectType: ProjectType.PROJECT,
      status: ProjectStatus.ACTIVE,
      description: 'iOS and Android mobile application for client portal',
      companyId,
    },
  ];

  const results: Project[] = [];
  for (const p of projectDefs) {
    let existing = await repo.findOne({ where: { projectCode: p.projectCode, companyId } });
    if (existing) {
      console.log(`[Project] Already exists: ${p.projectCode}`);
      results.push(existing);
      continue;
    }
    const saved = await repo.save(repo.create(p));
    console.log(`[Project] Created: ${p.projectCode} — ${p.projectName}`);
    results.push(saved);
  }
  return results;
}

// ── Task types ────────────────────────────────────────────────────────────────

async function seedTaskTypes(companyId: number): Promise<TaskType[]> {
  const repo = AppDataSource.getRepository(TaskType);

  const taskTypeDefs = [
    { typeCode: 'TT-PC', typeName: 'Project Customization', category: TaskCategory.PROJECT_CUSTOMIZATION, companyId },
    { typeCode: 'TT-SC', typeName: 'Support Customization', category: TaskCategory.SUPPORT_CUSTOMIZATION, companyId },
    { typeCode: 'TT-CR', typeName: 'Change Request', category: TaskCategory.CR, companyId },
  ];

  const results: TaskType[] = [];
  for (const t of taskTypeDefs) {
    let existing = await repo.findOne({ where: { typeCode: t.typeCode, companyId } });
    if (existing) {
      console.log(`[TaskType] Already exists: ${t.typeCode}`);
      results.push(existing);
      continue;
    }
    const saved = await repo.save(repo.create({ ...t, isActive: true }));
    console.log(`[TaskType] Created: ${t.typeCode} — ${t.typeName}`);
    results.push(saved);
  }
  return results;
}

// ── Employees ─────────────────────────────────────────────────────────────────

async function seedEmployees(companyId: number, projects: Project[]): Promise<Employee[]> {
  const repo = AppDataSource.getRepository(Employee);

  const employeeDefs = [
    { empCode: 'EMP-001', empName: 'Amit Patel',       consultantType: ConsultantType.PROJECT_MANAGER, email: 'amit.patel@acme.com',       mobileNumber: '9876543210', assignedProjectId: projects[0]?.id },
    { empCode: 'EMP-002', empName: 'Priya Singh',      consultantType: ConsultantType.FUNCTIONAL,       email: 'priya.singh@acme.com',      mobileNumber: '9876543211', assignedProjectId: projects[0]?.id },
    { empCode: 'EMP-003', empName: 'Vikram Desai',     consultantType: ConsultantType.TECHNICAL,        email: 'vikram.desai@acme.com',     mobileNumber: '9876543212', assignedProjectId: projects[0]?.id },
    { empCode: 'EMP-004', empName: 'Neha Gupta',       consultantType: ConsultantType.TECHNICAL,        email: 'neha.gupta@acme.com',       mobileNumber: '9876543213', assignedProjectId: projects[1]?.id },
    { empCode: 'EMP-005', empName: 'Rohan Mehta',      consultantType: ConsultantType.FUNCTIONAL,       email: 'rohan.mehta@acme.com',      mobileNumber: '9876543214', assignedProjectId: projects[1]?.id },
    { empCode: 'EMP-006', empName: 'Sneha Kulkarni',   consultantType: ConsultantType.CORE_TEAM,        email: 'sneha.kulkarni@acme.com',   mobileNumber: '9876543215', assignedProjectId: projects[2]?.id },
    { empCode: 'EMP-007', empName: 'Arjun Nair',       consultantType: ConsultantType.TECHNICAL,        email: 'arjun.nair@acme.com',       mobileNumber: '9876543216', assignedProjectId: projects[2]?.id },
    { empCode: 'EMP-008', empName: 'Kavita Reddy',     consultantType: ConsultantType.MANAGEMENT,       email: 'kavita.reddy@acme.com',     mobileNumber: '9876543217', assignedProjectId: null },
  ];

  const passwordHash = await bcrypt.hash('Emp@1234', BCRYPT_ROUNDS);
  const results: Employee[] = [];

  for (const e of employeeDefs) {
    const existing = await repo.findOne({ where: { email: e.email } });
    if (existing) {
      console.log(`[Employee] Already exists: ${e.empCode}`);
      results.push(existing);
      continue;
    }
    const saved = await repo.save(
      repo.create({
        ...e,
        passwordHash,
        isActive: true,
        companyId,
      }),
    );
    console.log(`[Employee] Created: ${e.empCode} — ${e.empName}`);
    results.push(saved);
  }
  return results;
}

// ── Task sheets + entries ─────────────────────────────────────────────────────

async function seedTaskSheets(
  companyId: number,
  employees: Employee[],
  projects: Project[],
  taskTypes: TaskType[],
) {
  const sheetRepo = AppDataSource.getRepository(DailyTaskSheet);
  const entryRepo = AppDataSource.getRepository(TaskEntry);

  // Check if sheets already exist
  const existingCount = await sheetRepo.count({ where: { companyId } });
  if (existingCount > 0) {
    console.log(`[TaskSheets] Already ${existingCount} sheets exist — skipping.`);
    return;
  }

  const weekdays = getRecentWeekdays(12); // last ~12 working days

  const descriptions = [
    'Configured user authentication module and integrated LDAP',
    'Fixed pagination issue on invoice listing page',
    'Reviewed and merged PR for payment gateway integration',
    'Designed database schema for inventory management',
    'Conducted UAT session with client stakeholders',
    'Optimized slow SQL queries in reporting module',
    'Created API endpoints for order management',
    'Updated technical documentation for deployment process',
    'Resolved critical bug in production - data sync failure',
    'Implemented export to Excel functionality for reports',
    'Set up CI/CD pipeline for staging environment',
    'Performed code review for team members',
    'Developed email notification service',
    'Analyzed performance bottlenecks in dashboard',
    'Client call — gathered requirements for Phase 2',
    'Migrated legacy stored procedures to TypeORM queries',
    'Built reusable React components for form builder',
    'Tested end-to-end workflow for purchase orders',
    'Prepared sprint demo presentation',
    'Integrated third-party logistics API',
  ];

  const statuses = [TaskStatus.FINISHED, TaskStatus.FINISHED, TaskStatus.FINISHED, TaskStatus.IN_PROGRESS, TaskStatus.FAILED];

  let sheetCount = 0;
  let entryCount = 0;

  for (const emp of employees) {
    // Each employee fills ~70% of the days
    for (const date of weekdays) {
      if (Math.random() > 0.7) continue; // skip ~30% of days

      // Pick 2-4 time blocks for the day
      const numEntries = 2 + Math.floor(Math.random() * 3); // 2–4
      const timeBlocks: { from: number; to: number }[] = [];
      let cursor = 9; // start at 9 AM

      for (let i = 0; i < numEntries; i++) {
        const duration = 1 + Math.floor(Math.random() * 3); // 1–3 hours
        const fromH = cursor;
        const toH = Math.min(cursor + duration, 18);
        if (fromH >= 18) break;
        timeBlocks.push({ from: fromH, to: toH });
        cursor = toH;
      }

      const totalHours = timeBlocks.reduce((sum, b) => sum + (b.to - b.from), 0);

      const sheet = await sheetRepo.save(
        sheetRepo.create({
          employeeId: emp.id,
          sheetDate: date,
          totalHours,
          isSubmitted: Math.random() > 0.2, // 80% submitted
          submittedAt: Math.random() > 0.2 ? new Date(date + 'T18:00:00') : null,
          remarks: Math.random() > 0.6 ? 'Regular day' : null,
          companyId,
        }),
      );
      sheetCount++;

      for (const block of timeBlocks) {
        const proj = emp.assignedProjectId
          ? projects.find((p) => p.id === emp.assignedProjectId) ?? projects[0]
          : projects[Math.floor(Math.random() * projects.length)];

        const tt = taskTypes[Math.floor(Math.random() * taskTypes.length)];
        const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        await entryRepo.save(
          entryRepo.create({
            taskSheetId: sheet.id,
            projectId: proj.id,
            taskTypeId: tt.id,
            fromTime: timeStr(block.from, 0),
            toTime: timeStr(block.to, 0),
            taskDescription: desc,
            status,
            companyId,
          }),
        );
        entryCount++;
      }
    }
  }

  console.log(`[TaskSheets] Created ${sheetCount} sheets with ${entryCount} entries.`);
}

// ── Employee hierarchy (reportsTo + isHr) ────────────────────────────────────

async function seedEmployeeHierarchy(employees: Employee[]) {
  const repo = AppDataSource.getRepository(Employee);

  // EMP-001 Amit Patel (PM) — reports to EMP-008 Kavita Reddy (Management)
  // EMP-002..007 report to EMP-001 Amit Patel (PM)
  // EMP-008 Kavita Reddy — is HR, reports to nobody (top level)

  const empMap = new Map(employees.map((e) => [e.empCode, e]));
  const kavita = empMap.get('EMP-008');
  const amit = empMap.get('EMP-001');

  if (!kavita || !amit) {
    console.log('[Hierarchy] Could not find key employees — skipping.');
    return;
  }

  // Kavita is HR
  await repo.update(kavita.id, { isHr: true });

  // Amit reports to Kavita
  await repo.update(amit.id, { reportsToId: kavita.id });

  // Everyone else reports to Amit
  for (const emp of employees) {
    if (emp.id === amit.id || emp.id === kavita.id) continue;
    await repo.update(emp.id, { reportsToId: amit.id });
  }

  console.log(`[Hierarchy] Set EMP-008 as HR, EMP-001 reports to EMP-008, others report to EMP-001.`);
}

// ── Leave types ───────────────────────────────────────────────────────────────

async function seedLeaveTypes(companyId: number): Promise<LeaveType[]> {
  const repo = AppDataSource.getRepository(LeaveType);

  const existingCount = await repo.count({ where: { companyId } });
  if (existingCount > 0) {
    console.log(`[LeaveTypes] Already ${existingCount} leave types — returning existing.`);
    return repo.find({ where: { companyId } });
  }

  const defs = [
    { reasonCode: 'SL', reasonName: 'Sick Leave', description: 'Medical or health-related absence' },
    { reasonCode: 'CL', reasonName: 'Casual Leave', description: 'Personal or casual time off' },
    { reasonCode: 'AL', reasonName: 'Annual Leave', description: 'Planned annual vacation' },
    { reasonCode: 'ML', reasonName: 'Maternity Leave', description: 'Maternity/paternity leave' },
    { reasonCode: 'WFH', reasonName: 'Work From Home', description: 'Working remotely from home' },
  ];

  const results: LeaveType[] = [];
  for (const d of defs) {
    const saved = await repo.save(repo.create({ ...d, isActive: true, companyId }));
    results.push(saved);
    console.log(`[LeaveType] Created: ${d.reasonCode} — ${d.reasonName}`);
  }
  return results;
}

// ── Leave requests (sample data) ──────────────────────────────────────────────

async function seedLeaveRequests(
  companyId: number,
  employees: Employee[],
  leaveTypes: LeaveType[],
) {
  const repo = AppDataSource.getRepository(LeaveRequest);

  const existingCount = await repo.count({ where: { companyId } });
  if (existingCount > 0) {
    console.log(`[LeaveRequests] Already ${existingCount} requests — skipping.`);
    return;
  }

  const empMap = new Map(employees.map((e) => [e.empCode, e]));
  const amit = empMap.get('EMP-001')!;
  const priya = empMap.get('EMP-002')!;
  const vikram = empMap.get('EMP-003')!;
  const neha = empMap.get('EMP-004')!;
  const kavita = empMap.get('EMP-008')!; // HR

  const sl = leaveTypes.find((r) => r.reasonCode === 'SL')!;
  const cl = leaveTypes.find((r) => r.reasonCode === 'CL')!;
  const al = leaveTypes.find((r) => r.reasonCode === 'AL')!;

  const requests = [
    // Priya: fully approved leave
    {
      employeeId: priya.id, leaveReasonId: sl.id,
      dateFrom: '2026-02-10', dateTo: '2026-02-11',
      remarks: 'Not feeling well', status: LeaveRequestStatus.HR_APPROVED,
      managerId: amit.id, managerActionAt: new Date('2026-02-09T10:00:00'),
      managerRemarks: 'Get well soon', hrId: kavita.id,
      hrActionAt: new Date('2026-02-09T14:00:00'), hrRemarks: 'Approved',
    },
    // Vikram: manager approved, pending HR
    {
      employeeId: vikram.id, leaveReasonId: cl.id,
      dateFrom: '2026-03-05', dateTo: '2026-03-05',
      remarks: 'Family function', status: LeaveRequestStatus.MANAGER_APPROVED,
      managerId: amit.id, managerActionAt: new Date('2026-03-03T09:00:00'),
      managerRemarks: null, hrId: null, hrActionAt: null, hrRemarks: null,
    },
    // Neha: pending (just submitted)
    {
      employeeId: neha.id, leaveReasonId: al.id,
      dateFrom: '2026-03-15', dateTo: '2026-03-20',
      remarks: 'Planned vacation', status: LeaveRequestStatus.PENDING,
      managerId: amit.id, managerActionAt: null,
      managerRemarks: null, hrId: null, hrActionAt: null, hrRemarks: null,
    },
    // Priya: manager rejected leave
    {
      employeeId: priya.id, leaveReasonId: cl.id,
      dateFrom: '2026-01-20', dateTo: '2026-01-22',
      remarks: 'Personal work', status: LeaveRequestStatus.MANAGER_REJECTED,
      managerId: amit.id, managerActionAt: new Date('2026-01-19T11:00:00'),
      managerRemarks: 'Critical deadline that week, please reschedule',
      hrId: null, hrActionAt: null, hrRemarks: null,
    },
    // Amit: pending (reports to Kavita)
    {
      employeeId: amit.id, leaveReasonId: sl.id,
      dateFrom: '2026-03-10', dateTo: '2026-03-10',
      remarks: 'Doctor appointment', status: LeaveRequestStatus.PENDING,
      managerId: kavita.id, managerActionAt: null,
      managerRemarks: null, hrId: null, hrActionAt: null, hrRemarks: null,
    },
  ];

  for (const r of requests) {
    await repo.save(repo.create({ ...r, companyId }));
  }
  console.log(`[LeaveRequests] Created ${requests.length} sample leave requests.`);
}

// ── Notifications ─────────────────────────────────────────────────────────────

async function seedNotifications(companyId: number) {
  const repo = AppDataSource.getRepository(Notification);

  const existingCount = await repo.count({ where: { companyId } });
  if (existingCount > 0) {
    console.log(`[Notifications] Already ${existingCount} notifications — skipping.`);
    return;
  }

  const notifs = [
    { type: NotificationType.EMPLOYEE_CREATED,     title: 'New Employee',           message: 'Amit Patel (EMP-001) has been added as Project Manager.',     isRead: true  },
    { type: NotificationType.EMPLOYEE_CREATED,     title: 'New Employee',           message: 'Priya Singh (EMP-002) has been added as Functional Consultant.', isRead: true  },
    { type: NotificationType.EMPLOYEE_CREATED,     title: 'New Employee',           message: 'Vikram Desai (EMP-003) has been added as Technical Consultant.', isRead: true  },
    { type: NotificationType.PROJECT_CREATED,      title: 'New Project',            message: 'Project "CRM Migration" (PRJ-002) has been created.',          isRead: true  },
    { type: NotificationType.PROJECT_CREATED,      title: 'New Project',            message: 'Project "Mobile App Development" (PRJ-003) has been created.', isRead: false },
    { type: NotificationType.PROJECT_UPDATED,      title: 'Project Updated',        message: 'Project "ERP Implementation" status changed to Active.',       isRead: false },
    { type: NotificationType.TASK_SHEET_SUBMITTED, title: 'Task Sheet Submitted',   message: 'Amit Patel submitted task sheet for today.',                   isRead: false },
    { type: NotificationType.TASK_SHEET_SUBMITTED, title: 'Task Sheet Submitted',   message: 'Priya Singh submitted task sheet for today.',                  isRead: false },
    { type: NotificationType.EMPLOYEE_DEACTIVATED, title: 'Employee Deactivated',   message: 'A former employee account has been deactivated.',              isRead: false },
    { type: NotificationType.TASK_SHEET_SUBMITTED, title: 'Task Sheet Submitted',   message: 'Vikram Desai submitted task sheet for today.',                 isRead: false },
  ];

  for (const n of notifs) {
    await repo.save(repo.create({ ...n, companyId, metadata: null }));
  }
  console.log(`[Notifications] Created ${notifs.length} notifications.`);
}

// ── Run ───────────────────────────────────────────────────────────────────────

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
