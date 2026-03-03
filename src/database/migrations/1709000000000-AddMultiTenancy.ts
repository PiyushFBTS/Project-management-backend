import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Multi-tenancy migration — adds the `companies` table and `company_id`
 * discriminator column to every existing table for row-level tenant isolation.
 *
 * Run with: npm run migration:run
 */
export class AddMultiTenancy1709000000000 implements MigrationInterface {
  name = 'AddMultiTenancy1709000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ──────────────────────────────────────────────────────────
    // 1. Create the companies table
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`companies\` (
        \`id\`                   INT            NOT NULL AUTO_INCREMENT,
        \`name\`                 VARCHAR(200)   NOT NULL,
        \`slug\`                 VARCHAR(100)   NOT NULL,
        \`logo_url\`             VARCHAR(500)   NULL,
        \`address\`              TEXT           NULL,
        \`contact_email\`        VARCHAR(150)   NULL,
        \`contact_phone\`        VARCHAR(20)    NULL,
        \`user_limit\`           INT            NOT NULL DEFAULT 50,
        \`license_expiry_date\`  DATE           NOT NULL,
        \`is_active\`            TINYINT(1)     NOT NULL DEFAULT 1,
        \`subscription_plan\`    ENUM('trial','basic','professional','enterprise') NOT NULL DEFAULT 'trial',
        \`subscription_start\`   DATE           NULL,
        \`created_at\`           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_company_slug\` (\`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ──────────────────────────────────────────────────────────
    // 2. Insert a default company for existing data
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO \`companies\` (\`name\`, \`slug\`, \`license_expiry_date\`, \`is_active\`, \`subscription_plan\`)
      VALUES ('Default Company', 'default', '2099-12-31', 1, 'enterprise')
    `);

    // Get the default company ID (should be 1, but let's be safe)
    const [{ id: defaultCompanyId }] = await queryRunner.query(
      `SELECT id FROM \`companies\` WHERE \`slug\` = 'default' LIMIT 1`,
    );

    // ──────────────────────────────────────────────────────────
    // 3. Add company_id to admin_users (NULLABLE — super admin has NULL)
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`admin_users\`
        ADD COLUMN \`company_id\` INT NULL AFTER \`is_active\`
    `);
    // Backfill: set company admins to default company, super admins stay NULL
    await queryRunner.query(`
      UPDATE \`admin_users\`
      SET \`company_id\` = ${defaultCompanyId}
      WHERE \`role\` = 'admin'
    `);
    await queryRunner.query(`
      ALTER TABLE \`admin_users\`
        ADD INDEX \`idx_admin_company\` (\`company_id\`),
        ADD CONSTRAINT \`fk_admin_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
    `);

    // ──────────────────────────────────────────────────────────
    // 4. Add company_id to employees (NOT NULL)
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`employees\`
        ADD COLUMN \`company_id\` INT NULL AFTER \`is_active\`
    `);
    await queryRunner.query(`
      UPDATE \`employees\` SET \`company_id\` = ${defaultCompanyId}
    `);
    await queryRunner.query(`
      ALTER TABLE \`employees\`
        MODIFY COLUMN \`company_id\` INT NOT NULL
    `);
    // Drop old unique index on emp_code and replace with compound
    await queryRunner.query(`
      ALTER TABLE \`employees\`
        DROP INDEX \`uq_emp_code\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`employees\`
        ADD UNIQUE KEY \`uq_company_emp_code\` (\`company_id\`, \`emp_code\`),
        ADD INDEX \`idx_employee_company\` (\`company_id\`),
        ADD CONSTRAINT \`fk_employee_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
    `);

    // ──────────────────────────────────────────────────────────
    // 5. Add company_id to projects (NOT NULL)
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`projects\`
        ADD COLUMN \`company_id\` INT NULL AFTER \`created_by\`
    `);
    await queryRunner.query(`
      UPDATE \`projects\` SET \`company_id\` = ${defaultCompanyId}
    `);
    await queryRunner.query(`
      ALTER TABLE \`projects\`
        MODIFY COLUMN \`company_id\` INT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`projects\`
        DROP INDEX \`uq_project_code\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`projects\`
        ADD UNIQUE KEY \`uq_company_project_code\` (\`company_id\`, \`project_code\`),
        ADD INDEX \`idx_project_company\` (\`company_id\`),
        ADD CONSTRAINT \`fk_project_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
    `);

    // ──────────────────────────────────────────────────────────
    // 6. Add company_id to task_types (NOT NULL)
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`task_types\`
        ADD COLUMN \`company_id\` INT NULL AFTER \`is_active\`
    `);
    await queryRunner.query(`
      UPDATE \`task_types\` SET \`company_id\` = ${defaultCompanyId}
    `);
    await queryRunner.query(`
      ALTER TABLE \`task_types\`
        MODIFY COLUMN \`company_id\` INT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`task_types\`
        DROP INDEX \`uq_type_code\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`task_types\`
        ADD UNIQUE KEY \`uq_company_type_code\` (\`company_id\`, \`type_code\`),
        ADD INDEX \`idx_tasktype_company\` (\`company_id\`),
        ADD CONSTRAINT \`fk_tasktype_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
    `);

    // ──────────────────────────────────────────────────────────
    // 7. Add company_id to daily_task_sheets (NOT NULL)
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`daily_task_sheets\`
        ADD COLUMN \`company_id\` INT NULL AFTER \`remarks\`
    `);
    await queryRunner.query(`
      UPDATE \`daily_task_sheets\` SET \`company_id\` = ${defaultCompanyId}
    `);
    await queryRunner.query(`
      ALTER TABLE \`daily_task_sheets\`
        MODIFY COLUMN \`company_id\` INT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`daily_task_sheets\`
        ADD INDEX \`idx_tasksheet_company\` (\`company_id\`),
        ADD CONSTRAINT \`fk_tasksheet_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
    `);

    // ──────────────────────────────────────────────────────────
    // 8. Add company_id to task_entries (NOT NULL)
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`task_entries\`
        ADD COLUMN \`company_id\` INT NULL AFTER \`status\`
    `);
    await queryRunner.query(`
      UPDATE \`task_entries\` SET \`company_id\` = ${defaultCompanyId}
    `);
    await queryRunner.query(`
      ALTER TABLE \`task_entries\`
        MODIFY COLUMN \`company_id\` INT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`task_entries\`
        ADD INDEX \`idx_taskentry_company\` (\`company_id\`),
        ADD CONSTRAINT \`fk_taskentry_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
    `);

    // ──────────────────────────────────────────────────────────
    // 9. Add company_id to notifications (NOT NULL)
    // ──────────────────────────────────────────────────────────
    // Create notifications table if it doesn't exist (may have been created by synchronize)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\`         INT            NOT NULL AUTO_INCREMENT,
        \`type\`       ENUM('employee_created','employee_deactivated','project_created','project_updated','task_sheet_submitted') NOT NULL,
        \`title\`      VARCHAR(150)   NOT NULL,
        \`message\`    TEXT           NOT NULL,
        \`is_read\`    TINYINT(1)     NOT NULL DEFAULT 0,
        \`metadata\`   JSON           NULL,
        \`created_at\` TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      ALTER TABLE \`notifications\`
        ADD COLUMN \`company_id\` INT NULL AFTER \`metadata\`
    `);
    await queryRunner.query(`
      UPDATE \`notifications\` SET \`company_id\` = ${defaultCompanyId}
    `);
    await queryRunner.query(`
      ALTER TABLE \`notifications\`
        MODIFY COLUMN \`company_id\` INT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`notifications\`
        ADD INDEX \`idx_notification_company\` (\`company_id\`),
        ADD CONSTRAINT \`fk_notification_company\`
          FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
    `);

    // ──────────────────────────────────────────────────────────
    // 10. Recreate views with company_id
    // ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE OR REPLACE VIEW \`vw_employee_man_days\` AS
      SELECT
        e.company_id,
        e.id                                           AS employee_id,
        e.emp_code,
        e.emp_name,
        e.consultant_type,
        p.id                                           AS project_id,
        p.project_code,
        p.project_name,
        DATE_FORMAT(dts.sheet_date, '%Y-%m')           AS month,
        COUNT(DISTINCT dts.sheet_date)                 AS days_filled,
        SUM(dts.total_hours)                           AS total_hours,
        ROUND(SUM(dts.total_hours) / 8, 2)             AS total_man_days
      FROM employees e
        JOIN daily_task_sheets dts ON dts.employee_id = e.id
        LEFT JOIN task_entries te  ON te.task_sheet_id = dts.id
        LEFT JOIN projects p       ON p.id = te.project_id
      WHERE dts.is_submitted = TRUE
      GROUP BY e.company_id, e.id, p.id, DATE_FORMAT(dts.sheet_date, '%Y-%m')
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW \`vw_project_man_days\` AS
      SELECT
        p.company_id,
        p.id                                           AS project_id,
        p.project_code,
        p.project_name,
        p.project_type,
        e.consultant_type,
        DATE_FORMAT(dts.sheet_date, '%Y-%m')           AS month,
        COUNT(DISTINCT e.id)                           AS employee_count,
        SUM(te.duration_hours)                         AS total_hours,
        ROUND(SUM(te.duration_hours) / 8, 2)           AS total_man_days
      FROM projects p
        JOIN task_entries te       ON te.project_id = p.id
        JOIN daily_task_sheets dts ON dts.id = te.task_sheet_id
        JOIN employees e           ON e.id = dts.employee_id
      WHERE dts.is_submitted = TRUE
      GROUP BY p.company_id, p.id, e.consultant_type, DATE_FORMAT(dts.sheet_date, '%Y-%m')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Restore original views ──
    await queryRunner.query(`
      CREATE OR REPLACE VIEW \`vw_employee_man_days\` AS
      SELECT
        e.id                                           AS employee_id,
        e.emp_code,
        e.emp_name,
        e.consultant_type,
        p.id                                           AS project_id,
        p.project_code,
        p.project_name,
        DATE_FORMAT(dts.sheet_date, '%Y-%m')           AS month,
        COUNT(DISTINCT dts.sheet_date)                 AS days_filled,
        SUM(dts.total_hours)                           AS total_hours,
        ROUND(SUM(dts.total_hours) / 8, 2)             AS total_man_days
      FROM employees e
        JOIN daily_task_sheets dts ON dts.employee_id = e.id
        LEFT JOIN task_entries te  ON te.task_sheet_id = dts.id
        LEFT JOIN projects p       ON p.id = te.project_id
      WHERE dts.is_submitted = TRUE
      GROUP BY e.id, p.id, DATE_FORMAT(dts.sheet_date, '%Y-%m')
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW \`vw_project_man_days\` AS
      SELECT
        p.id                                           AS project_id,
        p.project_code,
        p.project_name,
        p.project_type,
        e.consultant_type,
        DATE_FORMAT(dts.sheet_date, '%Y-%m')           AS month,
        COUNT(DISTINCT e.id)                           AS employee_count,
        SUM(te.duration_hours)                         AS total_hours,
        ROUND(SUM(te.duration_hours) / 8, 2)           AS total_man_days
      FROM projects p
        JOIN task_entries te       ON te.project_id = p.id
        JOIN daily_task_sheets dts ON dts.id = te.task_sheet_id
        JOIN employees e           ON e.id = dts.employee_id
      WHERE dts.is_submitted = TRUE
      GROUP BY p.id, e.consultant_type, DATE_FORMAT(dts.sheet_date, '%Y-%m')
    `);

    // ── Drop company_id from notifications ──
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`fk_notification_company\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP INDEX \`idx_notification_company\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`company_id\``);

    // ── Drop company_id from task_entries ──
    await queryRunner.query(`ALTER TABLE \`task_entries\` DROP FOREIGN KEY \`fk_taskentry_company\``);
    await queryRunner.query(`ALTER TABLE \`task_entries\` DROP INDEX \`idx_taskentry_company\``);
    await queryRunner.query(`ALTER TABLE \`task_entries\` DROP COLUMN \`company_id\``);

    // ── Drop company_id from daily_task_sheets ──
    await queryRunner.query(`ALTER TABLE \`daily_task_sheets\` DROP FOREIGN KEY \`fk_tasksheet_company\``);
    await queryRunner.query(`ALTER TABLE \`daily_task_sheets\` DROP INDEX \`idx_tasksheet_company\``);
    await queryRunner.query(`ALTER TABLE \`daily_task_sheets\` DROP COLUMN \`company_id\``);

    // ── Drop company_id from task_types ──
    await queryRunner.query(`ALTER TABLE \`task_types\` DROP FOREIGN KEY \`fk_tasktype_company\``);
    await queryRunner.query(`ALTER TABLE \`task_types\` DROP INDEX \`idx_tasktype_company\``);
    await queryRunner.query(`ALTER TABLE \`task_types\` DROP INDEX \`uq_company_type_code\``);
    await queryRunner.query(`ALTER TABLE \`task_types\` ADD UNIQUE KEY \`uq_type_code\` (\`type_code\`)`);
    await queryRunner.query(`ALTER TABLE \`task_types\` DROP COLUMN \`company_id\``);

    // ── Drop company_id from projects ──
    await queryRunner.query(`ALTER TABLE \`projects\` DROP FOREIGN KEY \`fk_project_company\``);
    await queryRunner.query(`ALTER TABLE \`projects\` DROP INDEX \`idx_project_company\``);
    await queryRunner.query(`ALTER TABLE \`projects\` DROP INDEX \`uq_company_project_code\``);
    await queryRunner.query(`ALTER TABLE \`projects\` ADD UNIQUE KEY \`uq_project_code\` (\`project_code\`)`);
    await queryRunner.query(`ALTER TABLE \`projects\` DROP COLUMN \`company_id\``);

    // ── Drop company_id from employees ──
    await queryRunner.query(`ALTER TABLE \`employees\` DROP FOREIGN KEY \`fk_employee_company\``);
    await queryRunner.query(`ALTER TABLE \`employees\` DROP INDEX \`idx_employee_company\``);
    await queryRunner.query(`ALTER TABLE \`employees\` DROP INDEX \`uq_company_emp_code\``);
    await queryRunner.query(`ALTER TABLE \`employees\` ADD UNIQUE KEY \`uq_emp_code\` (\`emp_code\`)`);
    await queryRunner.query(`ALTER TABLE \`employees\` DROP COLUMN \`company_id\``);

    // ── Drop company_id from admin_users ──
    await queryRunner.query(`ALTER TABLE \`admin_users\` DROP FOREIGN KEY \`fk_admin_company\``);
    await queryRunner.query(`ALTER TABLE \`admin_users\` DROP INDEX \`idx_admin_company\``);
    await queryRunner.query(`ALTER TABLE \`admin_users\` DROP COLUMN \`company_id\``);

    // ── Drop companies table ──
    await queryRunner.query(`DROP TABLE IF EXISTS \`companies\``);
  }
}
