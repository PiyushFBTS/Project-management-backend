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
         ROUND(COALESCE(AVG(NULLIF(dts.total_hours,0)), 0), 2) AS avg_hours_per_day,
         ROUND(COALESCE((
           SELECT SUM(1.0 / tc_count.cnt)
           FROM ticket_contributors tc_emp
           INNER JOIN (
             SELECT task_id, COUNT(*) AS cnt FROM ticket_contributors GROUP BY task_id
           ) tc_count ON tc_count.task_id = tc_emp.task_id
           WHERE tc_emp.employee_id = e.id
         ), 0), 2) AS ticket_count
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
    // Query directly from base tables to avoid dependency on view's company_id column
    return this.dataSource.query(
      `SELECT
         p.id                                        AS project_id,
         p.project_code                              AS project_code,
         p.project_name                              AS project_name,
         p.project_type                              AS project_type,
         ROUND(SUM(CASE WHEN e.consultant_type = 'project_manager' THEN te.duration_hours ELSE 0 END) / 8, 2) AS pm_man_days,
         ROUND(SUM(CASE WHEN e.consultant_type = 'functional'      THEN te.duration_hours ELSE 0 END) / 8, 2) AS functional_man_days,
         ROUND(SUM(CASE WHEN e.consultant_type = 'technical'       THEN te.duration_hours ELSE 0 END) / 8, 2) AS technical_man_days,
         ROUND(SUM(CASE WHEN e.consultant_type = 'management'      THEN te.duration_hours ELSE 0 END) / 8, 2) AS management_man_days,
         ROUND(SUM(CASE WHEN e.consultant_type = 'core_team'       THEN te.duration_hours ELSE 0 END) / 8, 2) AS core_team_man_days,
         ROUND(SUM(te.duration_hours) / 8, 2)        AS total_man_days,
         COUNT(DISTINCT e.id)                        AS employee_count
       FROM projects p
         JOIN task_entries te       ON te.project_id = p.id
         JOIN daily_task_sheets dts ON dts.id = te.task_sheet_id
         JOIN employees e           ON e.id = dts.employee_id
       WHERE p.company_id = ?
         AND dts.is_submitted = TRUE
         AND DATE_FORMAT(dts.sheet_date, '%Y-%m') = ?
       GROUP BY p.id, p.project_code, p.project_name, p.project_type
       ORDER BY total_man_days DESC`,
      [companyId, month],
    );
  }

  async getProjectDetail(companyId: number, projectId: number, month: string) {
    return this.dataSource.query(
      `SELECT
         e.consultant_type                     AS consultant_type,
         ROUND(SUM(te.duration_hours) / 8, 2)  AS total_man_days,
         COUNT(DISTINCT e.id)                  AS employee_count
       FROM projects p
         JOIN task_entries te       ON te.project_id = p.id
         JOIN daily_task_sheets dts ON dts.id = te.task_sheet_id
         JOIN employees e           ON e.id = dts.employee_id
       WHERE p.id = ?
         AND p.company_id = ?
         AND dts.is_submitted = TRUE
         AND DATE_FORMAT(dts.sheet_date, '%Y-%m') = ?
       GROUP BY e.consultant_type`,
      [projectId, companyId, month],
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

  // ── Employee contributed tickets ──────────────────────────────────────────

  async getEmployeeContributedTickets(companyId: number, employeeId: number) {
    return this.dataSource.query(
      `SELECT
         pt.id,
         pt.ticket_number,
         pt.title,
         pt.status,
         pt.priority,
         p.project_name,
         (SELECT COUNT(*) FROM ticket_contributors tc2 WHERE tc2.task_id = tc.task_id) AS contributor_count,
         ROUND(1.0 / (SELECT COUNT(*) FROM ticket_contributors tc2 WHERE tc2.task_id = tc.task_id), 2) AS weighted_share
       FROM ticket_contributors tc
       INNER JOIN project_tasks pt ON pt.id = tc.task_id
       LEFT JOIN projects p ON p.id = pt.project_id
       WHERE tc.employee_id = ? AND tc.company_id = ?
       ORDER BY pt.id DESC`,
      [employeeId, companyId],
    );
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

  // ── Attendance Report ──────────────────────────────────────────────────────

  async getAttendanceReport(companyId: number, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

    // Get all active employees
    const employees: any[] = await this.dataSource.query(
      `SELECT id, emp_code, emp_name, consultant_type FROM employees WHERE company_id = ? AND is_active = 1 ORDER BY emp_name`,
      [companyId],
    );

    // Get all submitted task sheets for the month
    const sheets: any[] = await this.dataSource.query(
      `SELECT employee_id, DATE_FORMAT(sheet_date, '%Y-%m-%d') AS sheet_date, total_hours, is_submitted
       FROM daily_task_sheets
       WHERE company_id = ? AND sheet_date BETWEEN ? AND ?
       ORDER BY sheet_date`,
      [companyId, startDate, endDate],
    );

    // Get public holidays for the month
    const holidays: any[] = await this.dataSource.query(
      `SELECT DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date, name FROM public_holidays WHERE company_id = ? AND holiday_date BETWEEN ? AND ?`,
      [companyId, startDate, endDate],
    );
    const holidayDates = new Set(holidays.map((h: any) => h.holiday_date));
    const holidayMap: Record<string, string> = {};
    holidays.forEach((h: any) => { holidayMap[h.holiday_date] = h.name; });

    // Get approved leaves for the month
    const leaves: any[] = await this.dataSource.query(
      `SELECT lr.employee_id, lr.date_from, lr.date_to, lt.reason_name AS leave_type
       FROM leave_requests lr
       LEFT JOIN leave_reasons lt ON lt.id = lr.leave_reason_id
       WHERE lr.company_id = ? AND lr.status IN ('hr_approved', 'manager_approved')
         AND lr.date_from <= ? AND lr.date_to >= ?`,
      [companyId, endDate, startDate],
    );

    // Build leave map: empId -> Set of leave dates
    const leaveMap = new Map<number, Map<string, string>>();
    for (const l of leaves) {
      if (!leaveMap.has(l.employee_id)) leaveMap.set(l.employee_id, new Map());
      const from = new Date(l.date_from);
      const to = new Date(l.date_to);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().split('T')[0];
        if (ds >= startDate && ds <= endDate) {
          leaveMap.get(l.employee_id)!.set(ds, l.leave_type ?? 'Leave');
        }
      }
    }

    // Build sheet map: empId -> Set of dates with hours > 0
    const sheetMap = new Map<number, Set<string>>();
    for (const s of sheets) {
      if (Number(s.total_hours) > 0) {
        if (!sheetMap.has(s.employee_id)) sheetMap.set(s.employee_id, new Set());
        sheetMap.get(s.employee_id)!.add(s.sheet_date);
      }
    }

    // Calculate working days (exclude Sundays + holidays)
    const allDays: string[] = [];
    let totalWorkingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      allDays.push(dateStr);
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      const isSunday = dayOfWeek === 0;
      const isHoliday = holidayDates.has(dateStr);
      if (!isSunday && !isHoliday) totalWorkingDays++;
    }

    // Build per-employee attendance
    const rows = employees.map((emp) => {
      const presentDates = sheetMap.get(emp.id) || new Set<string>();
      let presentDays = 0;
      let absentDays = 0;

      const empLeaves = leaveMap.get(emp.id) || new Map<string, string>();
      let leaveDays = 0;
      const dailyStatus: { date: string; status: 'present' | 'absent' | 'sunday' | 'holiday' | 'on_leave' | 'saturday'; leaveType?: string }[] = [];

      for (const dateStr of allDays) {
        const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
        const isSunday = dayOfWeek === 0;
        const isHoliday = holidayDates.has(dateStr);
        const isPresent = presentDates.has(dateStr);
        const leaveType = empLeaves.get(dateStr);
        const isOnLeave = !!leaveType;
        const isPast = new Date(dateStr + 'T23:59:59') < new Date();

        if (isSunday) {
          dailyStatus.push({ date: dateStr, status: 'sunday' });
        } else if (isHoliday) {
          dailyStatus.push({ date: dateStr, status: 'holiday' });
        } else if (isPresent) {
          presentDays++;
          dailyStatus.push({ date: dateStr, status: 'present' });
        } else if (isOnLeave) {
          leaveDays++;
          dailyStatus.push({ date: dateStr, status: 'on_leave', leaveType });
        } else {
          if (isPast) absentDays++;
          dailyStatus.push({ date: dateStr, status: isPast ? 'absent' : 'saturday' });
        }
      }

      const attendancePercent = totalWorkingDays > 0 ? Math.round(((presentDays + leaveDays) / totalWorkingDays) * 100) : 0;

      return {
        employeeId: emp.id,
        empCode: emp.emp_code,
        empName: emp.emp_name,
        consultantType: emp.consultant_type,
        presentDays,
        leaveDays,
        absentDays,
        totalWorkingDays,
        attendancePercent,
        dailyStatus,
      };
    });

    return {
      year,
      month,
      daysInMonth,
      totalWorkingDays,
      days: allDays,
      holidays: holidayMap,
      rows,
    };
  }

  // ── Employee Cost Report ───────────────────────────────────────────────────

  async getEmployeeCostReport(companyId: number, fromDate: string, toDate: string) {
    // Employee cost per project
    const employeeCosts: any[] = await this.dataSource.query(
      `SELECT
         e.id AS employee_id, e.emp_code, e.emp_name, e.consultant_type, e.annual_ctc,
         ROUND(e.annual_ctc / 12, 2) AS monthly_ctc,
         ROUND((e.annual_ctc / 12) / 26, 2) AS daily_rate,
         p.id AS project_id, p.project_code, p.project_name,
         ROUND(SUM(te.duration_hours) / 8, 2) AS man_days,
         SUM(te.duration_hours) AS total_hours,
         ROUND(((e.annual_ctc / 12) / 26) * (SUM(te.duration_hours) / 8), 2) AS cost
       FROM task_entries te
       JOIN daily_task_sheets ds ON ds.id = te.task_sheet_id
       JOIN employees e ON e.id = ds.employee_id
       LEFT JOIN projects p ON p.id = te.project_id
       WHERE ds.company_id = ? AND ds.sheet_date BETWEEN ? AND ?
         AND e.annual_ctc IS NOT NULL AND e.annual_ctc > 0
       GROUP BY e.id, p.id
       ORDER BY e.emp_name, cost DESC`,
      [companyId, fromDate, toDate],
    );

    // Project profitability
    const projectProfitability: any[] = await this.dataSource.query(
      `SELECT
         p.id, p.project_code, p.project_name, p.project_budget,
         COALESCE(SUM(ms.expected_amount), 0) AS milestone_total,
         COALESCE(SUM(ms.received_amount), 0) AS milestone_received,
         COALESCE(MAX(ec.total_cost), 0) AS employee_cost,
         COALESCE(SUM(ms.received_amount), 0) - COALESCE(MAX(ec.total_cost), 0) AS profit
       FROM projects p
       LEFT JOIN project_milestones ms ON ms.project_id = p.id
       LEFT JOIN (
         SELECT te2.project_id,
           ROUND(SUM(((e2.annual_ctc / 12) / 26) * (te2.duration_hours / 8)), 2) AS total_cost
         FROM task_entries te2
         JOIN daily_task_sheets ds2 ON ds2.id = te2.task_sheet_id
         JOIN employees e2 ON e2.id = ds2.employee_id
         WHERE ds2.company_id = ? AND ds2.sheet_date BETWEEN ? AND ?
           AND e2.annual_ctc IS NOT NULL AND e2.annual_ctc > 0
         GROUP BY te2.project_id
       ) ec ON ec.project_id = p.id
       WHERE p.company_id = ?
       GROUP BY p.id, p.project_code, p.project_name, p.project_budget
       HAVING milestone_total > 0 OR employee_cost > 0
       ORDER BY profit DESC`,
      [companyId, fromDate, toDate, companyId],
    );

    return { employeeCosts, projectProfitability };
  }

  // ── Monthly Grid Report ────────────────────────────────────────────────────

  async getMonthlyGridReport(companyId: number, year: number, month: number) {
    // Get all active employees
    const employees: any[] = await this.dataSource.query(
      `SELECT id, emp_code, emp_name, consultant_type FROM employees WHERE company_id = ? AND is_active = 1 ORDER BY emp_name`,
      [companyId],
    );

    // Get all sheets for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    const sheets: any[] = await this.dataSource.query(
      `SELECT employee_id, DATE_FORMAT(sheet_date, '%Y-%m-%d') AS sheet_date, total_hours, is_submitted
       FROM daily_task_sheets
       WHERE company_id = ? AND sheet_date BETWEEN ? AND ?
       ORDER BY sheet_date`,
      [companyId, startDate, endDate],
    );

    // Build a map: empId -> { date -> { hours, submitted } }
    const sheetMap = new Map<number, Map<string, { hours: number; submitted: boolean }>>();
    for (const s of sheets) {
      if (!sheetMap.has(s.employee_id)) sheetMap.set(s.employee_id, new Map());
      sheetMap.get(s.employee_id)!.set(s.sheet_date, {
        hours: Number(s.total_hours || 0),
        submitted: !!s.is_submitted,
      });
    }

    // Build result
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }

    const rows = employees.map((emp) => {
      const empSheets = sheetMap.get(emp.id) || new Map();
      const dailyData: { date: string; hours: number | null; submitted: boolean }[] = days.map((date) => {
        const entry = empSheets.get(date);
        return {
          date,
          hours: entry ? entry.hours : null,
          submitted: entry ? entry.submitted : false,
        };
      });
      const totalHours = dailyData.reduce((sum, d) => sum + (d.hours ?? 0), 0);
      const filledDays = dailyData.filter((d) => d.hours !== null).length;
      return {
        employeeId: emp.id,
        empCode: emp.emp_code,
        empName: emp.emp_name,
        consultantType: emp.consultant_type,
        totalHours,
        filledDays,
        days: dailyData,
      };
    });

    return { year, month, daysInMonth, days, rows };
  }

  async exportMonthlyGrid(companyId: number, year: number, month: number): Promise<Buffer> {
    const data = await this.getMonthlyGridReport(companyId, year, month);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${data.year}-${String(data.month).padStart(2, '0')}`);

    // Build columns: Code, Name, Type, day1, day2, ..., Total
    const columns: { header: string; key: string; width: number }[] = [
      { header: 'Code', key: 'empCode', width: 10 },
      { header: 'Name', key: 'empName', width: 22 },
      { header: 'Type', key: 'consultantType', width: 12 },
    ];
    for (let d = 1; d <= data.daysInMonth; d++) {
      columns.push({ header: String(d), key: `d${d}`, width: 5 });
    }
    columns.push({ header: 'Total', key: 'totalHours', width: 8 });
    columns.push({ header: 'Days', key: 'filledDays', width: 6 });
    ws.columns = columns;

    // Style header
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add rows
    for (const row of data.rows) {
      const rowData: any = {
        empCode: row.empCode,
        empName: row.empName,
        consultantType: row.consultantType,
        totalHours: row.totalHours,
        filledDays: row.filledDays,
      };
      for (let d = 0; d < row.days.length; d++) {
        rowData[`d${d + 1}`] = row.days[d].hours !== null ? row.days[d].hours : '';
      }
      const excelRow = ws.addRow(rowData);
      // Color cells: green if submitted, yellow if draft, empty if not filled
      for (let d = 0; d < row.days.length; d++) {
        const cell = excelRow.getCell(`d${d + 1}`);
        if (row.days[d].submitted) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // green
        } else if (row.days[d].hours !== null) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // yellow
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // red
        }
      }
    }

    return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
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
      { header: 'Avg Hrs/Day',     key: 'avg_hours_per_day', width: 12 },
      { header: 'Ticket Count',    key: 'ticket_count',    width: 14 },
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
