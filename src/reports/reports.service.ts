import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  // ── Employee-wise time sheet report ────────────────────────────────────────

  async getEmployeeWiseReport(companyId: number, fromDate: string, toDate: string, consultantType?: string) {
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

  async getEmployeeDetail(companyId: number, employeeId: number, fromDate: string, toDate: string) {
    return this.dataSource.query(
      `SELECT dts.id, dts.sheet_date, dts.total_hours, dts.man_days,
              dts.is_submitted, dts.submitted_at,
              COUNT(te.id) AS entry_count
       FROM daily_task_sheets dts
       LEFT JOIN task_entries te ON te.task_sheet_id = dts.id
       WHERE dts.employee_id = ?
         AND dts.company_id = ?
         AND dts.sheet_date BETWEEN ? AND ?
       GROUP BY dts.id
       ORDER BY dts.sheet_date DESC`,
      [employeeId, companyId, fromDate, toDate],
    );
  }

  // ── Project-wise man-day report ────────────────────────────────────────────

  async getProjectWiseReport(companyId: number, month: string) {
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

  async getProjectDetail(companyId: number, projectId: number, month: string) {
    return this.dataSource.query(
      `SELECT consultant_type, total_man_days, employee_count
       FROM vw_project_man_days
       WHERE project_id = ? AND month = ? AND company_id = ?`,
      [projectId, month, companyId],
    );
  }

  // ── Daily fill compliance report ───────────────────────────────────────────

  async getDailyFillReport(companyId: number, date: string) {
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

  // ── Last filled report ────────────────────────────────────────────────────

  async getLastFilledReport(companyId: number) {
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

  // ── Excel exports ──────────────────────────────────────────────────────────

  async exportEmployeeWise(companyId: number, fromDate: string, toDate: string): Promise<Buffer> {
    const data = await this.getEmployeeWiseReport(companyId, fromDate, toDate);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Employee Report');

    ws.columns = [
      { header: 'Emp Code',        key: 'emp_code',        width: 12 },
      { header: 'Employee Name',   key: 'emp_name',        width: 25 },
      { header: 'Consultant Type', key: 'consultant_type', width: 18 },
      { header: 'Project',         key: 'assigned_project',width: 25 },
      { header: 'Days Filled',     key: 'days_filled',     width: 12 },
      { header: 'Total Hours',     key: 'total_hours',     width: 12 },
      { header: 'Total Man-Days',  key: 'total_man_days',  width: 14 },
      { header: 'Avg Hrs/Day',     key: 'avg_hours_per_day', width: 12 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.forEach((row: any) => ws.addRow(row));

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async exportProjectWise(companyId: number, month: string): Promise<Buffer> {
    const data = await this.getProjectWiseReport(companyId, month);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Project Report');

    ws.columns = [
      { header: 'Project Code',      key: 'project_code',         width: 14 },
      { header: 'Project Name',      key: 'project_name',         width: 30 },
      { header: 'Type',              key: 'project_type',         width: 10 },
      { header: 'PM Man-Days',       key: 'pm_man_days',          width: 14 },
      { header: 'Functional',        key: 'functional_man_days',  width: 14 },
      { header: 'Technical',         key: 'technical_man_days',   width: 14 },
      { header: 'Management',        key: 'management_man_days',  width: 14 },
      { header: 'Core Team',         key: 'core_team_man_days',   width: 14 },
      { header: 'Total Man-Days',    key: 'total_man_days',       width: 14 },
      { header: 'Employees',         key: 'employee_count',       width: 10 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    data.forEach((row: any) => ws.addRow(row));

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
