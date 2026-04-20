import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - Adds `ticket_id` + `activity_type` columns to `task_entries` so the
 *   Ticket/Activity field in the Task Sheet UI is persisted and shown again
 *   when editing.
 * - Widens the `status` enum to include `awaiting_response`.
 */
export class ExtendTaskEntry1713200000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    // Add ticket_id + activity_type if not present
    await qr.query(`
      ALTER TABLE \`task_entries\`
      ADD COLUMN \`ticket_id\` INT NULL,
      ADD COLUMN \`activity_type\` VARCHAR(30) NULL
    `);

    // Widen status enum
    await qr.query(`
      ALTER TABLE \`task_entries\`
      MODIFY \`status\` ENUM('in_progress', 'finished', 'failed', 'awaiting_response')
      NOT NULL DEFAULT 'in_progress'
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      UPDATE \`task_entries\` SET \`status\` = 'in_progress'
      WHERE \`status\` = 'awaiting_response'
    `);
    await qr.query(`
      ALTER TABLE \`task_entries\`
      MODIFY \`status\` ENUM('in_progress', 'finished', 'failed')
      NOT NULL DEFAULT 'in_progress'
    `);
    await qr.query(`
      ALTER TABLE \`task_entries\`
      DROP COLUMN \`activity_type\`,
      DROP COLUMN \`ticket_id\`
    `);
  }
}
