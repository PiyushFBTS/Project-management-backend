import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMultiLevelLeaveApproval1711800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extend enum to include pm_approved and pm_rejected
    await queryRunner.query(`
      ALTER TABLE \`leave_requests\`
      MODIFY COLUMN \`status\` enum(
        'pending','pm_approved','pm_rejected',
        'manager_approved','manager_rejected',
        'hr_approved','hr_rejected','cancelled'
      ) NOT NULL DEFAULT 'pending'
    `);

    // Add project-manager approval columns
    await queryRunner.query(`
      ALTER TABLE \`leave_requests\`
      ADD COLUMN \`pm_id\` int DEFAULT NULL,
      ADD COLUMN \`pm_action_at\` datetime(6) DEFAULT NULL,
      ADD COLUMN \`pm_remarks\` text DEFAULT NULL,
      ADD KEY \`IDX_leave_pm\` (\`pm_id\`),
      ADD CONSTRAINT \`FK_leave_pm\` FOREIGN KEY (\`pm_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_leave_pm\``);
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP KEY \`IDX_leave_pm\``);
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP COLUMN \`pm_remarks\``);
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP COLUMN \`pm_action_at\``);
    await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP COLUMN \`pm_id\``);
    await queryRunner.query(`
      ALTER TABLE \`leave_requests\`
      MODIFY COLUMN \`status\` enum(
        'pending','manager_approved','manager_rejected',
        'hr_approved','hr_rejected','cancelled'
      ) NOT NULL DEFAULT 'pending'
    `);
  }
}
