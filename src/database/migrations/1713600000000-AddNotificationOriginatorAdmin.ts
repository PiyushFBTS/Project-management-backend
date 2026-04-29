import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `originator_admin_id` to `notifications` so we can suppress a
 * notification for the admin who actually triggered it (e.g. when an
 * admin submits their own task sheet or applies for their own leave,
 * other admins of the same company should still see the alert but the
 * originator should not).
 */
export class AddNotificationOriginatorAdmin1713600000000 implements MigrationInterface {
  name = 'AddNotificationOriginatorAdmin1713600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`notifications\`
        ADD COLUMN \`originator_admin_id\` INT NULL AFTER \`target_employee_id\`,
        ADD INDEX \`idx_notification_originator_admin\` (\`originator_admin_id\`),
        ADD CONSTRAINT \`fk_notification_originator_admin\`
          FOREIGN KEY (\`originator_admin_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`fk_notification_originator_admin\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP INDEX \`idx_notification_originator_admin\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`originator_admin_id\``);
  }
}
