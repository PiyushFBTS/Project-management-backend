import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePmFromLeaveApproval1711900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop PM foreign key and columns
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_leave_pm\``);
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP KEY \`IDX_leave_pm\``);
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP COLUMN \`pm_remarks\``);
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP COLUMN \`pm_action_at\``);
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP COLUMN \`pm_id\``);

    // Revert any pm_approved rows back to pending (shouldn't exist in prod but safety net)
    await queryRunner.query(`UPDATE \`leave_requests\` SET \`status\` = 'pending' WHERE \`status\` = 'pm_approved'`);
    await queryRunner.query(`UPDATE \`leave_requests\` SET \`status\` = 'manager_rejected' WHERE \`status\` = 'pm_rejected'`);

    // Remove pm_approved and pm_rejected from enum
    await queryRunner.query(`
      ALTER TABLE \`leave_requests\`
      MODIFY COLUMN \`status\` enum(
        'pending','manager_approved','manager_rejected',
        'hr_approved','hr_rejected','cancelled'
      ) NOT NULL DEFAULT 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add pm enum values
    await queryRunner.query(`
      ALTER TABLE \`leave_requests\`
      MODIFY COLUMN \`status\` enum(
        'pending','pm_approved','pm_rejected',
        'manager_approved','manager_rejected',
        'hr_approved','hr_rejected','cancelled'
      ) NOT NULL DEFAULT 'pending'
    `);

    // Re-add PM columns
    await queryRunner.query(`
      ALTER TABLE \`leave_requests\`
      ADD COLUMN \`pm_id\` int DEFAULT NULL,
      ADD COLUMN \`pm_action_at\` datetime(6) DEFAULT NULL,
      ADD COLUMN \`pm_remarks\` text DEFAULT NULL,
      ADD KEY \`IDX_leave_pm\` (\`pm_id\`),
      ADD CONSTRAINT \`FK_leave_pm\` FOREIGN KEY (\`pm_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL
    `);
  }
}
