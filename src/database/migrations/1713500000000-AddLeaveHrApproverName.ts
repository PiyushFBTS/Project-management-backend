import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `leave_requests.hr_id` references `employees.id`, which means an admin who
 * final-approves a leave has nowhere to leave a footprint. Add a plain string
 * column for the approver's display name — frontend shows it regardless of
 * whether the approver was an HR employee or an admin.
 */
export class AddLeaveHrApproverName1713500000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE leave_requests
      ADD COLUMN hr_approver_name VARCHAR(200) NULL
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE leave_requests DROP COLUMN hr_approver_name`);
  }
}
