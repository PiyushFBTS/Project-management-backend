import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(companyId: number, month?: string) {
    const m = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const today = new Date().toISOString().split('T')[0];

    const [[filledToday], [totalActive], [activeProjects], [monthManDays]] =
      await Promise.all([
        this.dataSource.query(
          `SELECT COUNT(*) AS count FROM daily_task_sheets
           WHERE sheet_date = ? AND is_submitted = 1 AND company_id = ?`,
          [today, companyId],
        ),
        this.dataSource.query(
          `SELECT COUNT(*) AS count FROM employees WHERE is_active = 1 AND company_id = ?`,
          [companyId],
        ),
        this.dataSource.query(
          `SELECT COUNT(*) AS count FROM projects WHERE status = 'active' AND company_id = ?`,
          [companyId],
        ),
        this.dataSource.query(
          `SELECT COALESCE(SUM(man_days), 0) AS total
           FROM daily_task_sheets
           WHERE DATE_FORMAT(sheet_date, '%Y-%m') = ? AND is_submitted = 1 AND company_id = ?`,
          [m, companyId],
        ),
      ]);

    const totalActiveEmployees = Number(totalActive.count);
    const filled = Number(filledToday.count);

    return {
      totalEmployees: totalActiveEmployees,
      activeProjects: Number(activeProjects.count),
      totalManDaysThisMonth: Number(monthManDays.total),
      fillRateToday: totalActiveEmployees > 0 ? Math.round((filled / totalActiveEmployees) * 100) : 0,
      filledToday: filled,
      totalActiveEmployees,
    };
  }

  async getTaskSummary(companyId: number) {
    const [byStatus, byPriority] = await Promise.all([
      this.dataSource.query(
        `SELECT status, COUNT(*) AS count FROM project_tasks WHERE company_id = ? GROUP BY status`,
        [companyId],
      ),
      this.dataSource.query(
        `SELECT priority, COUNT(*) AS count FROM project_tasks WHERE company_id = ? GROUP BY priority`,
        [companyId],
      ),
    ]);

    const totalTasks = byStatus.reduce((sum: number, r: any) => sum + Number(r.count), 0);
    const todoCount = Number(byStatus.find((r: any) => r.status === 'todo')?.count ?? 0);
    const inProgressCount = Number(byStatus.find((r: any) => r.status === 'in_progress')?.count ?? 0);
    const inReviewCount = Number(byStatus.find((r: any) => r.status === 'in_review')?.count ?? 0);
    const doneCount = Number(byStatus.find((r: any) => r.status === 'done')?.count ?? 0);

    return {
      totalTasks,
      todoCount,
      inProgressCount,
      inReviewCount,
      doneCount,
      byStatus,
      byPriority,
    };
  }

  async getManDaysByType(companyId: number, month?: string) {
    const m = month || new Date().toISOString().slice(0, 7);
    return this.dataSource.query(
      `SELECT consultant_type,
              SUM(total_man_days) AS total_man_days,
              COUNT(DISTINCT employee_id) AS employee_count
       FROM vw_employee_man_days
       WHERE month = ? AND company_id = ?
       GROUP BY consultant_type
       ORDER BY total_man_days DESC`,
      [m, companyId],
    );
  }

  async getManDaysByProject(companyId: number, month?: string) {
    const m = month || new Date().toISOString().slice(0, 7);
    return this.dataSource.query(
      `SELECT project_id, project_code, project_name, project_type,
              SUM(total_man_days) AS total_man_days, SUM(employee_count) AS employee_count
       FROM vw_project_man_days
       WHERE month = ? AND company_id = ?
       GROUP BY project_id, project_code, project_name, project_type
       ORDER BY total_man_days DESC`,
      [m, companyId],
    );
  }

  async getFillRateTrend(companyId: number, days: number = 30) {
    const totalEmployees = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM employees WHERE is_active = 1 AND company_id = ?`,
      [companyId],
    );
    const total = Number(totalEmployees[0].total);

    const trend = await this.dataSource.query(
      `SELECT sheet_date, COUNT(*) AS filled_count
       FROM daily_task_sheets
       WHERE sheet_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND is_submitted = 1 AND company_id = ?
       GROUP BY sheet_date
       ORDER BY sheet_date ASC`,
      [days, companyId],
    );

    return trend.map((row: any) => ({
      date: row.sheet_date,
      filled_count: Number(row.filled_count),
      total_count: total,
      fill_rate: total > 0 ? Math.round((Number(row.filled_count) / total) * 100) : 0,
    }));
  }

  async getTopEmployeesByHours(companyId: number, month?: string, limit: number = 10) {
    const m = month || new Date().toISOString().slice(0, 7);
    return this.dataSource.query(
      `SELECT e.id AS employee_id, e.emp_code, e.emp_name, e.consultant_type,
              COALESCE(SUM(dts.total_hours), 0) AS total_hours,
              ROUND(COALESCE(SUM(dts.man_days), 0), 2) AS total_man_days
       FROM employees e
       LEFT JOIN daily_task_sheets dts
         ON dts.employee_id = e.id
         AND DATE_FORMAT(dts.sheet_date, '%Y-%m') = ?
         AND dts.is_submitted = 1
       WHERE e.is_active = 1 AND e.company_id = ?
       GROUP BY e.id, e.emp_code, e.emp_name, e.consultant_type
       ORDER BY total_hours DESC
       LIMIT ?`,
      [m, companyId, limit],
    );
  }
}
