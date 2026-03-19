import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskMentionNotificationType1712200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`notifications\`
      MODIFY COLUMN \`type\` enum(
        'employee_created','employee_deactivated','project_created','project_updated',
        'task_sheet_submitted','leave_request_submitted','leave_request_manager_approved',
        'leave_request_manager_rejected','leave_request_hr_approved','leave_request_hr_rejected',
        'leave_request_cancelled','task_assigned','task_status_changed','task_commented',
        'birthday','work_anniversary','task_mention'
      ) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`notifications\`
      MODIFY COLUMN \`type\` enum(
        'employee_created','employee_deactivated','project_created','project_updated',
        'task_sheet_submitted','leave_request_submitted','leave_request_manager_approved',
        'leave_request_manager_rejected','leave_request_hr_approved','leave_request_hr_rejected',
        'leave_request_cancelled','task_assigned','task_status_changed','task_commented',
        'birthday','work_anniversary'
      ) NOT NULL
    `);
  }
}
