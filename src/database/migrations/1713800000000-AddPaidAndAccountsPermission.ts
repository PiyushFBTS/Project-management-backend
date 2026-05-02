import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Two coupled additions for the new "Accounts" workflow:
 *
 *   1. `expenses.paid` — boolean tracking whether an approved expense has
 *      actually been paid out. Defaults to false; only flippable once the
 *      expense is approved (enforced in the service layer).
 *
 *   2. `employees.is_accounts` — permission flag mirroring `is_hr`. An
 *      employee with `is_accounts = 1` can view all expenses and toggle
 *      the paid status, but is NOT in the approval flow (HR keeps that).
 *      Both flags are independent — the same employee can have both.
 */
export class AddPaidAndAccountsPermission1713800000000 implements MigrationInterface {
  name = 'AddPaidAndAccountsPermission1713800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`expenses\`
        ADD COLUMN \`paid\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`remarks\`,
        ADD COLUMN \`paid_at\` TIMESTAMP NULL AFTER \`paid\`,
        ADD COLUMN \`paid_by_employee_id\` INT NULL AFTER \`paid_at\`,
        ADD COLUMN \`paid_by_admin_id\` INT NULL AFTER \`paid_by_employee_id\`,
        ADD COLUMN \`paid_by_name\` VARCHAR(255) NULL AFTER \`paid_by_admin_id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`employees\`
        ADD COLUMN \`is_accounts\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`is_hr\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`employees\` DROP COLUMN \`is_accounts\``);
    await queryRunner.query(`
      ALTER TABLE \`expenses\`
        DROP COLUMN \`paid_by_name\`,
        DROP COLUMN \`paid_by_admin_id\`,
        DROP COLUMN \`paid_by_employee_id\`,
        DROP COLUMN \`paid_at\`,
        DROP COLUMN \`paid\`
    `);
  }
}
