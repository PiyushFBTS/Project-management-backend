import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds project planning tables: project_phases, project_tasks, project_task_comments.
 * Extends notifications.type enum with task-related values.
 */
export class AddProjectPlanning1709600000000 implements MigrationInterface {
  name = 'AddProjectPlanning1709600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Create project_phases table ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`project_phases\` (
        \`id\`          INT            NOT NULL AUTO_INCREMENT,
        \`project_id\`  INT            NOT NULL,
        \`name\`        VARCHAR(200)   NOT NULL,
        \`description\` TEXT           NULL,
        \`start_date\`  DATE           NULL,
        \`end_date\`    DATE           NULL,
        \`status\`      ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
        \`sort_order\`  INT            NOT NULL DEFAULT 0,
        \`company_id\`  INT            NOT NULL,
        \`created_at\`  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_phase_project\` (\`project_id\`),
        INDEX \`idx_phase_company\` (\`company_id\`),
        CONSTRAINT \`fk_phase_project\`
          FOREIGN KEY (\`project_id\`) REFERENCES \`projects\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_phase_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 2. Create project_tasks table ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`project_tasks\` (
        \`id\`              INT            NOT NULL AUTO_INCREMENT,
        \`project_id\`      INT            NOT NULL,
        \`phase_id\`        INT            NULL,
        \`title\`           VARCHAR(300)   NOT NULL,
        \`description\`     TEXT           NULL,
        \`assignee_id\`     INT            NULL,
        \`priority\`        ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
        \`status\`          ENUM('todo','in_progress','in_review','done') NOT NULL DEFAULT 'todo',
        \`due_date\`        DATE           NULL,
        \`estimated_hours\` DECIMAL(6,2)   NULL,
        \`sort_order\`      INT            NOT NULL DEFAULT 0,
        \`company_id\`      INT            NOT NULL,
        \`created_at\`      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_task_project\`  (\`project_id\`),
        INDEX \`idx_task_phase\`    (\`phase_id\`),
        INDEX \`idx_task_assignee\` (\`assignee_id\`),
        INDEX \`idx_task_company\`  (\`company_id\`),
        INDEX \`idx_task_status\`   (\`status\`),
        CONSTRAINT \`fk_task_project\`
          FOREIGN KEY (\`project_id\`) REFERENCES \`projects\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_task_phase\`
          FOREIGN KEY (\`phase_id\`) REFERENCES \`project_phases\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_task_assignee\`
          FOREIGN KEY (\`assignee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_task_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 3. Create project_task_comments table ──────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`project_task_comments\` (
        \`id\`          INT            NOT NULL AUTO_INCREMENT,
        \`task_id\`     INT            NOT NULL,
        \`author_id\`   INT            NOT NULL,
        \`author_type\` ENUM('admin','employee') NOT NULL,
        \`content\`     TEXT           NOT NULL,
        \`company_id\`  INT            NOT NULL,
        \`created_at\`  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_comment_task\`    (\`task_id\`),
        INDEX \`idx_comment_company\` (\`company_id\`),
        CONSTRAINT \`fk_comment_task\`
          FOREIGN KEY (\`task_id\`) REFERENCES \`project_tasks\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_comment_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 4. Extend notifications type enum ──────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`notifications\` MODIFY COLUMN \`type\` ENUM(
        'employee_created','employee_deactivated','project_created','project_updated','task_sheet_submitted',
        'leave_request_submitted','leave_request_manager_approved','leave_request_manager_rejected',
        'leave_request_hr_approved','leave_request_hr_rejected','leave_request_cancelled',
        'task_assigned','task_status_changed','task_commented'
      ) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert enum
    await queryRunner.query(`
      ALTER TABLE \`notifications\` MODIFY COLUMN \`type\` ENUM(
        'employee_created','employee_deactivated','project_created','project_updated','task_sheet_submitted',
        'leave_request_submitted','leave_request_manager_approved','leave_request_manager_rejected',
        'leave_request_hr_approved','leave_request_hr_rejected','leave_request_cancelled'
      ) NOT NULL
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS \`project_task_comments\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`project_tasks\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`project_phases\``);
  }
}
