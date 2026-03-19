import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee, ConsultantType } from '../database/entities/employee.entity';
import { Project } from '../database/entities/project.entity';
import { TaskType } from '../database/entities/task-type.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(TaskType)
    private readonly taskTypeRepo: Repository<TaskType>,
    private readonly dataSource: DataSource,
  ) {}

  getProfile(employeeId: number) {
    return this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['assignedProject'],
    });
  }

  getActiveProjects(companyId: number) {
    return this.projectRepo.find({
      where: { status: 'active' as any, companyId },
      select: ['id', 'projectCode', 'projectName', 'projectType'],
      order: { projectName: 'ASC' },
    });
  }

  getActiveTaskTypes(companyId: number) {
    return this.taskTypeRepo.find({
      where: { isActive: true, companyId },
      select: ['id', 'typeCode', 'typeName', 'category'],
      order: { typeName: 'ASC' },
    });
  }

  async getPersonalDashboard(employeeId: number) {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = this.getWeekStart();
    const monthStart = today.slice(0, 7) + '-01';

    const [[todayStatus], [weekHours], [monthStats], taskStats] =
      await Promise.all([
        this.dataSource.query(
          `SELECT total_hours, is_submitted FROM daily_task_sheets
           WHERE employee_id = ? AND sheet_date = ?`,
          [employeeId, today],
        ),
        this.dataSource.query(
          `SELECT COALESCE(SUM(total_hours), 0) AS hours
           FROM daily_task_sheets
           WHERE employee_id = ? AND sheet_date >= ? AND is_submitted = 1`,
          [employeeId, weekStart],
        ),
        this.dataSource.query(
          `SELECT COALESCE(SUM(total_hours), 0) AS total_hours,
                  ROUND(COALESCE(SUM(man_days), 0), 2) AS man_days,
                  COUNT(*) AS days_filled
           FROM daily_task_sheets
           WHERE employee_id = ? AND sheet_date >= ? AND is_submitted = 1`,
          [employeeId, monthStart],
        ),
        this.dataSource.query(
          `SELECT te.status, COUNT(*) AS count
           FROM task_entries te
           JOIN daily_task_sheets dts ON dts.id = te.task_sheet_id
           WHERE dts.employee_id = ? AND dts.sheet_date >= ? AND dts.is_submitted = 1
           GROUP BY te.status`,
          [employeeId, monthStart],
        ),
      ]);

    // Last 7 days sheet history for the chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const last7Days = await this.dataSource.query(
      `SELECT dts.sheet_date AS date,
              COALESCE(dts.total_hours, 0) AS hours,
              dts.is_submitted AS submitted
       FROM daily_task_sheets dts
       WHERE dts.employee_id = ? AND dts.sheet_date >= ?
       ORDER BY dts.sheet_date ASC`,
      [employeeId, sevenDaysAgoStr],
    );

    // Build full 7-day array (fill missing days with 0)
    const last7DaysChart: { date: string; hours: number; submitted: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      const dateStr = d.toISOString().split('T')[0];
      const existing = last7Days.find((r: any) => r.date === dateStr);
      last7DaysChart.push({
        date: dateStr,
        hours: existing ? Number(existing.hours) : 0,
        submitted: existing ? !!existing.submitted : false,
      });
    }

    // Count total sheets submitted this month
    const [{ sheetsThisMonth }] = await this.dataSource.query(
      `SELECT COUNT(*) AS sheetsThisMonth
       FROM daily_task_sheets
       WHERE employee_id = ? AND sheet_date >= ? AND is_submitted = 1`,
      [employeeId, monthStart],
    );

    return {
      today: { filled: !!todayStatus, totalHours: todayStatus ? Number(todayStatus.total_hours) : 0 },
      thisWeek: { totalHours: Number(weekHours.hours) },
      thisMonth: {
        totalHours: Number(monthStats.total_hours),
        manDays: Number(monthStats.man_days),
        daysFilled: Number(monthStats.days_filled),
        sheetsSubmitted: Number(sheetsThisMonth),
      },
      taskStats,
      last7Days: last7DaysChart,
    };
  }

  async getTeamDashboard(employee: Employee) {
    const companyId = employee.companyId;
    const month = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().split('T')[0];
    const isProjectManager = employee.consultantType === ConsultantType.PROJECT_MANAGER;

    const projectFilter = isProjectManager && employee.assignedProjectId
      ? 'AND e.assigned_project_id = ?'
      : '';
    const params: any[] = [today, companyId];
    if (isProjectManager && employee.assignedProjectId) params.push(employee.assignedProjectId);

    const [filledToday, manDaysByType] = await Promise.all([
      this.dataSource.query(
        `SELECT e.id, e.emp_code, e.emp_name, e.consultant_type,
                CASE WHEN dts.id IS NOT NULL THEN 1 ELSE 0 END AS is_filled,
                COALESCE(dts.total_hours, 0) AS total_hours
         FROM employees e
         LEFT JOIN daily_task_sheets dts
           ON dts.employee_id = e.id AND dts.sheet_date = ? AND dts.is_submitted = 1
         WHERE e.is_active = 1 AND e.company_id = ? ${projectFilter}
         ORDER BY is_filled ASC, e.emp_name ASC`,
        params,
      ),
      this.dataSource.query(
        `SELECT consultant_type, SUM(total_man_days) AS man_days
         FROM vw_employee_man_days
         WHERE month = ? AND company_id = ? ${isProjectManager && employee.assignedProjectId ? 'AND project_id = ?' : ''}
         GROUP BY consultant_type`,
        isProjectManager && employee.assignedProjectId
          ? [month, companyId, employee.assignedProjectId]
          : [month, companyId],
      ),
    ]);

    return { month, today, filledToday, manDaysByType };
  }

  async getTeamEmployeeWiseReport(employee: Employee, fromDate: string, toDate: string) {
    const companyId = employee.companyId;
    const isProjectManager = employee.consultantType === ConsultantType.PROJECT_MANAGER;
    const projectFilter = isProjectManager && employee.assignedProjectId
      ? 'AND e.assigned_project_id = ?'
      : '';
    const extra = isProjectManager && employee.assignedProjectId ? [employee.assignedProjectId] : [];

    return this.dataSource.query(
      `SELECT e.id, e.emp_code, e.emp_name, e.consultant_type,
              COALESCE(SUM(dts.total_hours), 0)        AS total_hours,
              ROUND(COALESCE(SUM(dts.man_days), 0), 2) AS total_man_days,
              COUNT(DISTINCT dts.sheet_date)            AS days_filled
       FROM employees e
       LEFT JOIN daily_task_sheets dts
         ON dts.employee_id = e.id
         AND dts.is_submitted = 1
         AND dts.sheet_date BETWEEN ? AND ?
       WHERE e.is_active = 1 AND e.company_id = ? ${projectFilter}
       GROUP BY e.id ORDER BY e.emp_name`,
      [fromDate, toDate, companyId, ...extra],
    );
  }

  async getTeamProjectWiseReport(employee: Employee, month: string) {
    const companyId = employee.companyId;
    const isProjectManager = employee.consultantType === ConsultantType.PROJECT_MANAGER;
    const projectFilter = isProjectManager && employee.assignedProjectId
      ? 'AND project_id = ?'
      : '';
    const extra = isProjectManager && employee.assignedProjectId ? [employee.assignedProjectId] : [];

    return this.dataSource.query(
      `SELECT project_id, project_code, project_name,
              SUM(total_man_days) AS total_man_days,
              SUM(employee_count) AS employee_count
       FROM vw_project_man_days
       WHERE month = ? AND company_id = ? ${projectFilter}
       GROUP BY project_id, project_code, project_name
       ORDER BY total_man_days DESC`,
      [month, companyId, ...extra],
    );
  }

  // ── Self / HR Reports ─────────────────────────────────────────────────────

  async getSelfEmployeeWiseReport(employeeId: number, companyId: number, fromDate: string, toDate: string) {
    return this.dataSource.query(
      `SELECT
         e.id, e.emp_code, e.emp_name, e.consultant_type,
         p.project_name AS assigned_project,
         COUNT(DISTINCT dts.sheet_date)            AS days_filled,
         COALESCE(SUM(dts.total_hours), 0)         AS total_hours,
         ROUND(COALESCE(SUM(dts.man_days), 0), 2)  AS total_man_days,
         ROUND(COALESCE(AVG(NULLIF(dts.total_hours,0)), 0), 2) AS avg_hours_per_day
       FROM employees e
       LEFT JOIN projects p ON p.id = e.assigned_project_id
       LEFT JOIN daily_task_sheets dts
         ON dts.employee_id = e.id
         AND dts.is_submitted = 1
         AND dts.sheet_date BETWEEN ? AND ?
       WHERE e.id = ? AND e.company_id = ?
       GROUP BY e.id, e.emp_code, e.emp_name, e.consultant_type, assigned_project`,
      [fromDate, toDate, employeeId, companyId],
    );
  }

  async getAllEmployeeWiseReport(companyId: number, fromDate: string, toDate: string, consultantType?: string) {
    const params: any[] = [fromDate, toDate, companyId];
    let typeFilter = '';
    if (consultantType) {
      typeFilter = 'AND e.consultant_type = ?';
      params.push(consultantType);
    }
    return this.dataSource.query(
      `SELECT
         e.id, e.emp_code, e.emp_name, e.consultant_type,
         p.project_name AS assigned_project,
         COUNT(DISTINCT dts.sheet_date)            AS days_filled,
         COALESCE(SUM(dts.total_hours), 0)         AS total_hours,
         ROUND(COALESCE(SUM(dts.man_days), 0), 2)  AS total_man_days,
         ROUND(COALESCE(AVG(NULLIF(dts.total_hours,0)), 0), 2) AS avg_hours_per_day
       FROM employees e
       LEFT JOIN projects p ON p.id = e.assigned_project_id
       LEFT JOIN daily_task_sheets dts
         ON dts.employee_id = e.id
         AND dts.is_submitted = 1
         AND dts.sheet_date BETWEEN ? AND ?
       WHERE e.is_active = 1 AND e.company_id = ? ${typeFilter}
       GROUP BY e.id, e.emp_code, e.emp_name, e.consultant_type, assigned_project
       ORDER BY e.emp_name ASC`,
      params,
    );
  }

  async getAllProjectWiseReport(companyId: number, month: string) {
    return this.dataSource.query(
      `SELECT
         project_id, project_code, project_name, project_type,
         SUM(CASE WHEN consultant_type = 'project_manager' THEN total_man_days ELSE 0 END) AS pm_man_days,
         SUM(CASE WHEN consultant_type = 'functional'      THEN total_man_days ELSE 0 END) AS functional_man_days,
         SUM(CASE WHEN consultant_type = 'technical'       THEN total_man_days ELSE 0 END) AS technical_man_days,
         SUM(CASE WHEN consultant_type = 'management'      THEN total_man_days ELSE 0 END) AS management_man_days,
         SUM(CASE WHEN consultant_type = 'core_team'       THEN total_man_days ELSE 0 END) AS core_team_man_days,
         SUM(total_man_days)   AS total_man_days,
         SUM(employee_count)   AS employee_count
       FROM vw_project_man_days
       WHERE month = ? AND company_id = ?
       GROUP BY project_id, project_code, project_name, project_type
       ORDER BY total_man_days DESC`,
      [month, companyId],
    );
  }

  async getAllDailyFillReport(companyId: number, date: string) {
    const rows = await this.dataSource.query(
      `SELECT
         e.id, e.emp_code, e.emp_name, e.consultant_type,
         CASE WHEN dts.id IS NOT NULL THEN 1 ELSE 0 END AS is_filled,
         COALESCE(dts.total_hours, 0)                   AS total_hours,
         dts.id                                          AS sheet_id,
         (SELECT COUNT(*) FROM task_entries te WHERE te.task_sheet_id = dts.id) AS entry_count
       FROM employees e
       LEFT JOIN daily_task_sheets dts
         ON dts.employee_id = e.id
         AND dts.sheet_date = ?
         AND dts.is_submitted = 1
       WHERE e.is_active = 1 AND e.company_id = ?
       ORDER BY is_filled ASC, e.emp_name ASC`,
      [date, companyId],
    );
    const total = rows.length;
    const filled = rows.filter((r: any) => r.is_filled).length;
    return { date, filledCount: filled, totalCount: total, fillRate: total > 0 ? Math.round((filled / total) * 100) : 0, rows };
  }

  async getAllLastFilledReport(companyId: number) {
    return this.dataSource.query(
      `SELECT
         e.id,
         e.emp_code,
         e.emp_name,
         e.consultant_type,
         p.project_name AS assigned_project,
         latest.sheet_date   AS last_filled_date,
         latest.total_hours  AS last_filled_hours,
         latest.submitted_at AS last_submitted_at,
         DATEDIFF(CURDATE(), latest.sheet_date) AS days_since_last_fill
       FROM employees e
       LEFT JOIN projects p ON p.id = e.assigned_project_id
       LEFT JOIN (
         SELECT dts.employee_id, dts.sheet_date, dts.total_hours, dts.submitted_at
         FROM daily_task_sheets dts
         INNER JOIN (
           SELECT employee_id, MAX(sheet_date) AS max_date
           FROM daily_task_sheets
           WHERE is_submitted = 1
           GROUP BY employee_id
         ) latest_dates
           ON dts.employee_id = latest_dates.employee_id
           AND dts.sheet_date = latest_dates.max_date
         WHERE dts.is_submitted = 1
       ) latest ON latest.employee_id = e.id
       WHERE e.is_active = 1 AND e.company_id = ?
       ORDER BY days_since_last_fill DESC, e.emp_name ASC`,
      [companyId],
    );
  }

  private getWeekStart(): string {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d.toISOString().split('T')[0];
  }
}
