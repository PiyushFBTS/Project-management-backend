import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds leave management tables and employee hierarchy fields.
 *
 * - Alters `employees`: adds `reports_to_id` (self-ref FK) and `is_hr`
 * - Creates `leave_reasons` (company-scoped lookup)
 * - Creates `leave_requests` (with two-level approval workflow)
 * - Creates `leave_request_watchers` (CC list)
 * - Extends `notifications.type` enum with leave-related values
 *
 * Run with: npm run migration:run
 */
export class AddLeaveManagement1709100000000 implements MigrationInterface {
  name = 'AddLeaveManagement1709100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ──────────────────────────────────────────────────────────
    // 1. Add hierarchy columns to employees
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`employees\`
        ADD COLUMN \`reports_to_id\` INT NULL AFTER \`is_active\`,
        ADD COLUMN \`is_hr\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`reports_to_id\`,
        ADD INDEX \`idx_employee_reports_to\` (\`reports_to_id\`),
        ADD CONSTRAINT \`fk_employee_reports_to\`
          FOREIGN KEY (\`reports_to_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL
    `);

    // ──────────────────────────────────────────────────────────
    // 2. Create leave_reasons table
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`leave_reasons\` (
        \`id\`          INT            NOT NULL AUTO_INCREMENT,
        \`reason_code\` VARCHAR(50)    NOT NULL,
        \`reason_name\` VARCHAR(150)   NOT NULL,
        \`description\` TEXT           NULL,
        \`is_active\`   TINYINT(1)     NOT NULL DEFAULT 1,
        \`company_id\`  INT            NOT NULL,
        \`created_at\`  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_company_reason_code\` (\`company_id\`, \`reason_code\`),
        INDEX \`idx_leave_reason_company\` (\`company_id\`),
        CONSTRAINT \`fk_leave_reason_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ──────────────────────────────────────────────────────────
    // 3. Create leave_requests table
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`leave_requests\` (
        \`id\`                    INT            NOT NULL AUTO_INCREMENT,
        \`employee_id\`           INT            NOT NULL,
        \`leave_reason_id\`       INT            NOT NULL,
        \`date_from\`             DATE           NOT NULL,
        \`date_to\`               DATE           NOT NULL,
        \`total_days\`            INT            GENERATED ALWAYS AS (DATEDIFF(\`date_to\`, \`date_from\`) + 1) STORED,
        \`remarks\`               TEXT           NULL,
        \`status\`                ENUM('pending','manager_approved','manager_rejected','hr_approved','hr_rejected','cancelled') NOT NULL DEFAULT 'pending',
        \`manager_id\`            INT            NULL,
        \`manager_action_at\`     TIMESTAMP      NULL,
        \`manager_remarks\`       TEXT           NULL,
        \`hr_id\`                 INT            NULL,
        \`hr_action_at\`          TIMESTAMP      NULL,
        \`hr_remarks\`            TEXT           NULL,
        \`company_id\`            INT            NOT NULL,
        \`created_at\`            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_leave_req_employee\`  (\`employee_id\`),
        INDEX \`idx_leave_req_company\`   (\`company_id\`),
        INDEX \`idx_leave_req_status\`    (\`status\`),
        INDEX \`idx_leave_req_dates\`     (\`date_from\`, \`date_to\`),
        INDEX \`idx_leave_req_manager\`   (\`manager_id\`),
        CONSTRAINT \`fk_leave_req_employee\`
          FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_leave_req_reason\`
          FOREIGN KEY (\`leave_reason_id\`) REFERENCES \`leave_reasons\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`fk_leave_req_manager\`
          FOREIGN KEY (\`manager_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_leave_req_hr\`
          FOREIGN KEY (\`hr_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_leave_req_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ──────────────────────────────────────────────────────────
    // 4. Create leave_request_watchers table
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`leave_request_watchers\` (
        \`id\`                INT       NOT NULL AUTO_INCREMENT,
        \`leave_request_id\`  INT       NOT NULL,
        \`employee_id\`       INT       NOT NULL,
        \`company_id\`        INT       NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_leave_watcher\` (\`leave_request_id\`, \`employee_id\`),
        INDEX \`idx_watcher_employee\` (\`employee_id\`),
        INDEX \`idx_watcher_company\` (\`company_id\`),
        CONSTRAINT \`fk_watcher_request\`
          FOREIGN KEY (\`leave_request_id\`) REFERENCES \`leave_requests\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_watcher_employee\`
          FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_watcher_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ──────────────────────────────────────────────────────────
    // 5. Extend notifications type enum
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`notifications\` MODIFY COLUMN \`type\` ENUM(
        'employee_created','employee_deactivated','project_created','project_updated','task_sheet_submitted',
        'leave_request_submitted','leave_request_manager_approved','leave_request_manager_rejected',
        'leave_request_hr_approved','leave_request_hr_rejected','leave_request_cancelled'
      ) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert in reverse order
    await queryRunner.query(`
      ALTER TABLE \`notifications\` MODIFY COLUMN \`type\` ENUM(
        'employee_created','employee_deactivated','project_created','project_updated','task_sheet_submitted'
      ) NOT NULL
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS \`leave_request_watchers\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`leave_requests\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`leave_reasons\``);

    await queryRunner.query(`ALTER TABLE \`employees\` DROP FOREIGN KEY \`fk_employee_reports_to\``);
    await queryRunner.query(`ALTER TABLE \`employees\` DROP INDEX \`idx_employee_reports_to\``);
    await queryRunner.query(`ALTER TABLE \`employees\` DROP COLUMN \`is_hr\`, DROP COLUMN \`reports_to_id\``);
  }
}
