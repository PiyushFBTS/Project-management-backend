/**
 * ACME Group — Task Sheet Sample Data Seed
 *
 * Adds 2 extra employees (EMP-009, EMP-010) to reach 10 total,
 * clears existing task sheets for the company, then creates
 * 10 days of sheets with specific daily submission counts:
 *
 *   Day (oldest→newest): 7, 8, 3, 10, 2, 8, 7, 9, 10, 5  (today)
 *
 * Run with:
 *   npm run db:seed:acme
 */
import 'reflect-metadata';
import { config } from 'dotenv';
config();

import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { AdminUser } from '../entities/admin-user.entity';
import { Employee, ConsultantType } from '../entities/employee.entity';
import { Project } from '../entities/project.entity';
import { TaskType } from '../entities/task-type.entity';
import { DailyTaskSheet } from '../entities/daily-task-sheet.entity';
import { TaskEntry, TaskStatus } from '../entities/task-entry.entity';

// ── Submission counts per day (index 0 = oldest, index 9 = today) ─────────────
const DAILY_SUBMISSIONS = [7, 8, 3, 10, 2, 8, 7, 9, 10, 5];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the last N working days (Mon–Fri) from today, oldest first. */
function getLastNWeekdays(n: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  // Include today
  const todayDay = d.getDay();
  if (todayDay !== 0 && todayDay !== 6) {
    dates.unshift(d.toISOString().slice(0, 10));
  }
  while (dates.length < n) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.unshift(d.toISOString().slice(0, 10));
    }
  }
  return dates.slice(-n);
}

function timeStr(h: number, m = 0): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Pick a random item from an array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Task descriptions pool ────────────────────────────────────────────────────

const DESCRIPTIONS = [
  'Configured user authentication module and integrated LDAP',
  'Fixed pagination issue on invoice listing page',
  'Reviewed and merged PR for payment gateway integration',
  'Designed database schema for inventory management',
  'Conducted UAT session with client stakeholders',
  'Optimized slow SQL queries in reporting module',
  'Created REST API endpoints for order management',
  'Updated technical documentation for deployment process',
  'Resolved critical production bug — data sync failure',
  'Implemented export-to-Excel functionality for reports',
  'Set up CI/CD pipeline for staging environment',
  'Performed code review for team members',
  'Developed email notification service',
  'Analysed performance bottlenecks in dashboard',
  'Client call — gathered requirements for Phase 2',
  'Migrated legacy stored procedures to TypeORM queries',
  'Built reusable React components for form builder',
  'Tested end-to-end workflow for purchase orders',
  'Prepared sprint demo presentation for client',
  'Integrated third-party logistics API',
  'Fixed role-based access control issues in admin panel',
  'Wrote unit tests for invoice calculation module',
  'Updated UI mockups based on client feedback',
  'Deployed hotfix to production environment',
  'Participated in daily standup and backlog grooming',
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to database…');
  await AppDataSource.initialize();
  console.log('Connected.\n');

  // ── 1. Find ACME company via admin@acme.com ─────────────────────────────────
  const adminRepo = AppDataSource.getRepository(AdminUser);
  const acmeAdmin = await adminRepo.findOne({ where: { email: 'admin@acme.com' } });
  if (!acmeAdmin || !acmeAdmin.companyId) {
    throw new Error('Could not find ACME company admin (admin@acme.com). Run the main seed first.');
  }
  const companyId = acmeAdmin.companyId;
  console.log(`[Company] ACME Group — id: ${companyId}`);

  // ── 2. Ensure 10 employees exist ────────────────────────────────────────────
  const empRepo = AppDataSource.getRepository(Employee);
  const projRepo = AppDataSource.getRepository(Project);

  const projects = await projRepo.find({ where: { companyId } });
  if (!projects.length) {
    throw new Error('No projects found for ACME. Run the main seed first.');
  }

  const extraEmployees = [
    {
      empCode: 'EMP-009', empName: 'Rajesh Kumar',
      consultantType: ConsultantType.TECHNICAL,
      email: 'rajesh.kumar@acme.com', mobileNumber: '9876543218',
      assignedProjectId: projects[2]?.id ?? projects[0].id,
    },
    {
      empCode: 'EMP-010', empName: 'Sunita Joshi',
      consultantType: ConsultantType.FUNCTIONAL,
      email: 'sunita.joshi@acme.com', mobileNumber: '9876543219',
      assignedProjectId: projects[3]?.id ?? projects[0].id,
    },
  ];

  const passwordHash = await bcrypt.hash('Emp@1234', 12);
  for (const e of extraEmployees) {
    const existing = await empRepo.findOne({ where: { email: e.email } });
    if (existing) {
      console.log(`[Employee] Already exists: ${e.empCode} — ${e.empName}`);
      continue;
    }
    await empRepo.save(empRepo.create({ ...e, passwordHash, isActive: true, companyId }));
    console.log(`[Employee] Created: ${e.empCode} — ${e.empName}`);
  }

  // Reload all 10 employees
  const employees = await empRepo.find({ where: { companyId, isActive: true } });
  console.log(`\n[Employees] Total active: ${employees.length}`);
  if (employees.length < DAILY_SUBMISSIONS[3]) {
    console.warn(`  ⚠ Only ${employees.length} employees but max daily target is ${Math.max(...DAILY_SUBMISSIONS)}. Some days will be capped.`);
  }

  // ── 3. Load task types ───────────────────────────────────────────────────────
  const ttRepo = AppDataSource.getRepository(TaskType);
  const taskTypes = await ttRepo.find({ where: { companyId, isActive: true } });
  if (!taskTypes.length) {
    throw new Error('No task types found for ACME. Run the main seed first.');
  }

  // ── 4. Clear existing task sheets (and cascade-delete entries) ───────────────
  const sheetRepo = AppDataSource.getRepository(DailyTaskSheet);
  const existing = await sheetRepo.count({ where: { companyId } });
  if (existing > 0) {
    await sheetRepo
      .createQueryBuilder()
      .delete()
      .where('company_id = :companyId', { companyId })
      .execute();
    console.log(`\n[TaskSheets] Cleared ${existing} existing sheets.`);
  }

  // ── 5. Seed task sheets ──────────────────────────────────────────────────────
  const entryRepo = AppDataSource.getRepository(TaskEntry);
  const dates = getLastNWeekdays(10);

  console.log('\n[TaskSheets] Seeding…');
  console.log('  Date          Submitted  Not submitted  Total hours');
  console.log('  ─────────────────────────────────────────────────────');

  let totalSheets = 0;
  let totalEntries = 0;

  for (let di = 0; di < dates.length; di++) {
    const date = dates[di];
    const targetSubmitted = Math.min(DAILY_SUBMISSIONS[di], employees.length);
    const targetNotSubmitted = employees.length - targetSubmitted;

    // Shuffle employees to randomly pick who submitted vs who didn't
    const shuffled = [...employees].sort(() => Math.random() - 0.5);
    const submitters = shuffled.slice(0, targetSubmitted);
    const nonSubmitters = shuffled.slice(targetSubmitted);

    let dayTotalHours = 0;

    // Submitted sheets (isSubmitted = true)
    for (const emp of submitters) {
      // 2–3 time blocks, realistic working hours
      const numBlocks = 2 + Math.floor(Math.random() * 2); // 2 or 3
      const blocks: { from: number; to: number }[] = [];
      let cursor = 9;

      for (let i = 0; i < numBlocks; i++) {
        const duration = 1 + Math.floor(Math.random() * 3); // 1–3 hrs
        const toH = Math.min(cursor + duration, 18);
        if (cursor >= 18) break;
        blocks.push({ from: cursor, to: toH });
        cursor = toH;
      }

      const totalHours = blocks.reduce((s, b) => s + (b.to - b.from), 0);
      dayTotalHours += totalHours;

      const submittedAt = new Date(`${date}T18:30:00`);

      const sheet = await sheetRepo.save(
        sheetRepo.create({
          employeeId: emp.id,
          sheetDate: date,
          totalHours,
          isSubmitted: true,
          submittedAt,
          remarks: Math.random() > 0.6 ? 'Regular workday' : null,
          companyId,
        }),
      );
      totalSheets++;

      for (const block of blocks) {
        const proj = emp.assignedProjectId
          ? (projects.find((p) => p.id === emp.assignedProjectId) ?? pick(projects))
          : pick(projects);

        await entryRepo.save(
          entryRepo.create({
            taskSheetId: sheet.id,
            projectId: proj.id,
            taskTypeId: pick(taskTypes).id,
            fromTime: timeStr(block.from),
            toTime: timeStr(block.to),
            taskDescription: pick(DESCRIPTIONS),
            status: pick([TaskStatus.FINISHED, TaskStatus.FINISHED, TaskStatus.IN_PROGRESS]),
            companyId,
          }),
        );
        totalEntries++;
      }
    }

    // Non-submitted / draft sheets
    for (const emp of nonSubmitters) {
      // Draft: 0–2 entries, not submitted
      const hasDraft = Math.random() > 0.4; // 60% chance they started a draft
      const totalHours = hasDraft ? 1 + Math.floor(Math.random() * 3) : 0;

      const sheet = await sheetRepo.save(
        sheetRepo.create({
          employeeId: emp.id,
          sheetDate: date,
          totalHours,
          isSubmitted: false,
          submittedAt: null,
          remarks: null,
          companyId,
        }),
      );
      totalSheets++;

      if (hasDraft && totalHours > 0) {
        const proj = emp.assignedProjectId
          ? (projects.find((p) => p.id === emp.assignedProjectId) ?? pick(projects))
          : pick(projects);

        await entryRepo.save(
          entryRepo.create({
            taskSheetId: sheet.id,
            projectId: proj.id,
            taskTypeId: pick(taskTypes).id,
            fromTime: timeStr(9),
            toTime: timeStr(9 + totalHours),
            taskDescription: pick(DESCRIPTIONS),
            status: TaskStatus.IN_PROGRESS,
            companyId,
          }),
        );
        totalEntries++;
      }
    }

    console.log(
      `  ${date}   ${String(targetSubmitted).padStart(2)}/${employees.length}         ${String(employees.length - targetSubmitted).padStart(2)}            ${dayTotalHours} hrs`,
    );
  }

  console.log('\n  ─────────────────────────────────────────────────────');
  console.log(`\n[Done] Created ${totalSheets} task sheets and ${totalEntries} task entries.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
