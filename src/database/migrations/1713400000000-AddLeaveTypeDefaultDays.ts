import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a `default_days` column to `leave_reasons`. This is the annual
 * allowance per leave type (e.g. Casual Leave = 12 days). The leave-balance
 * screen deducts HR-approved leave requests from this total.
 *
 * Zero is a sentinel for "no quota enforced" (e.g. bereavement handled ad-hoc).
 */
export class AddLeaveTypeDefaultDays1713400000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE leave_reasons
      ADD COLUMN default_days INT NOT NULL DEFAULT 0
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE leave_reasons DROP COLUMN default_days`);
  }
}
