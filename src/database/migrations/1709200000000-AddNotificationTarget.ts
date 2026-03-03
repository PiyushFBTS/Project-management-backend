import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds target_employee_id to notifications table so that notifications
 * can be scoped to individual employees (for the mobile app).
 */
export class AddNotificationTarget1709200000000 implements MigrationInterface {
  name = 'AddNotificationTarget1709200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`notifications\`
        ADD COLUMN \`target_employee_id\` INT NULL AFTER \`metadata\`,
        ADD INDEX \`idx_notification_target_employee\` (\`target_employee_id\`),
        ADD CONSTRAINT \`fk_notification_target_employee\`
          FOREIGN KEY (\`target_employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`fk_notification_target_employee\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP INDEX \`idx_notification_target_employee\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`target_employee_id\``);
  }
}
