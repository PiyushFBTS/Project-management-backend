import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `submitter_admin_id` to `expenses` so we can identify the admin who
 * actually submitted an admin-bridged expense by id (not by display name).
 * The self-approval guard for admin expenses uses this column to block an
 * admin from approving / rejecting their own expense — a bare name check
 * would collide for two admins with the same name.
 */
export class AddExpenseSubmitterAdminId1713700000000 implements MigrationInterface {
  name = 'AddExpenseSubmitterAdminId1713700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`expenses\`
        ADD COLUMN \`submitter_admin_id\` INT NULL AFTER \`submitter_name\`,
        ADD INDEX \`idx_expense_submitter_admin\` (\`submitter_admin_id\`),
        ADD CONSTRAINT \`fk_expense_submitter_admin\`
          FOREIGN KEY (\`submitter_admin_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`expenses\` DROP FOREIGN KEY \`fk_expense_submitter_admin\``);
    await queryRunner.query(`ALTER TABLE \`expenses\` DROP INDEX \`idx_expense_submitter_admin\``);
    await queryRunner.query(`ALTER TABLE \`expenses\` DROP COLUMN \`submitter_admin_id\``);
  }
}
