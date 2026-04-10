-- ============================================================
-- IT Project Management System — Full Database Schema
-- MySQL 8.0+  |  utf8mb4  |  InnoDB
--
-- Usage (run in MySQL shell or MySQL Workbench):
--   source /path/to/schema.sql
--
-- This script is idempotent: safe to run multiple times.
-- For application use, prefer TypeORM migrations instead:
--   npm run migration:run
-- ============================================================

CREATE DATABASE IF NOT EXISTS `it_project_management`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `it_project_management`;

-- ============================================================
-- Table: admin_users
-- Web portal administrators (Super Admin / Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id`            INT            NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)   NOT NULL,
  `email`         VARCHAR(150)   NOT NULL,
  `password_hash` VARCHAR(255)   NOT NULL,
  `role`          ENUM('super_admin','admin') NOT NULL DEFAULT 'admin',
  `is_active`     TINYINT(1)     NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: projects
-- ============================================================
CREATE TABLE IF NOT EXISTS `projects` (
  `id`           INT            NOT NULL AUTO_INCREMENT,
  `project_code` VARCHAR(50)    NOT NULL            COMMENT 'Short code, e.g. PRJ-001',
  `project_name` VARCHAR(200)   NOT NULL,
  `project_type` ENUM('project','support') NOT NULL,
  `status`       ENUM('active','inactive','completed') NOT NULL DEFAULT 'active',
  `description`  TEXT,
  `created_by`   INT                                COMMENT 'FK → admin_users.id',
  `created_at`   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_code`   (`project_code`),
  INDEX `idx_project_type`       (`project_type`),
  INDEX `idx_project_status`     (`status`),
  CONSTRAINT `fk_project_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: task_types
-- ============================================================
CREATE TABLE IF NOT EXISTS `task_types` (
  `id`          INT            NOT NULL AUTO_INCREMENT,
  `type_code`   VARCHAR(50)    NOT NULL            COMMENT 'Short code, e.g. TT-PC',
  `type_name`   VARCHAR(150)   NOT NULL,
  `category`    ENUM('project_customization','support_customization','cr') NOT NULL,
  `description` TEXT,
  `is_active`   TINYINT(1)     NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_type_code` (`type_code`),
  INDEX `idx_category`      (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: employees
-- Mobile app users
-- ============================================================
CREATE TABLE IF NOT EXISTS `employees` (
  `id`                  INT            NOT NULL AUTO_INCREMENT,
  `emp_code`            VARCHAR(50)    NOT NULL            COMMENT 'e.g. EMP-001',
  `emp_name`            VARCHAR(150)   NOT NULL,
  `consultant_type`     ENUM('project_manager','functional','technical','management','core_team') NOT NULL,
  `email`               VARCHAR(150)   NOT NULL            COMMENT 'Mobile app login email',
  `password_hash`       VARCHAR(255)   NOT NULL,
  `mobile_number`       VARCHAR(20)    NOT NULL,
  `assigned_project_id` INT                               COMMENT 'FK → projects.id',
  `is_active`           TINYINT(1)     NOT NULL DEFAULT 1,
  `created_at`          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emp_code`           (`emp_code`),
  UNIQUE KEY `uq_emp_email`          (`email`),
  INDEX `idx_consultant_type`        (`consultant_type`),
  INDEX `idx_assigned_project`       (`assigned_project_id`),
  CONSTRAINT `fk_employee_project`
    FOREIGN KEY (`assigned_project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: daily_task_sheets
-- One sheet per employee per day.
-- man_days is a GENERATED STORED column: ROUND(total_hours / 8, 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS `daily_task_sheets` (
  `id`           INT            NOT NULL AUTO_INCREMENT,
  `employee_id`  INT            NOT NULL,
  `sheet_date`   DATE           NOT NULL,
  `total_hours`  DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
  `man_days`     DECIMAL(5,2)   GENERATED ALWAYS AS (ROUND(`total_hours` / 8, 2)) STORED
                                         COMMENT '1 man-day = 8 hours',
  `submitted_at` TIMESTAMP      NULL     DEFAULT NULL,
  `is_submitted` TINYINT(1)     NOT NULL DEFAULT 0,
  `remarks`      TEXT,
  `created_at`   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emp_date`   (`employee_id`, `sheet_date`),
  INDEX `idx_sheet_date`     (`sheet_date`),
  INDEX `idx_submitted`      (`is_submitted`),
  CONSTRAINT `fk_sheet_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: task_entries
-- Individual task lines within a daily task sheet.
-- duration_hours is a GENERATED STORED column.
-- ============================================================
CREATE TABLE IF NOT EXISTS `task_entries` (
  `id`               INT            NOT NULL AUTO_INCREMENT,
  `task_sheet_id`    INT            NOT NULL,
  `project_id`       INT            NOT NULL,
  `task_type_id`     INT                               COMMENT 'Optional classification',
  `from_time`        TIME           NOT NULL,
  `to_time`          TIME           NOT NULL,
  `duration_hours`   DECIMAL(5,2)   GENERATED ALWAYS AS (ROUND(TIMESTAMPDIFF(MINUTE, `from_time`, `to_time`) / 60, 2)) STORED,
  `task_description` TEXT           NOT NULL,
  `status`           ENUM('in_progress','finished','failed') NOT NULL DEFAULT 'in_progress',
  `created_at`       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_entry_sheet`       (`task_sheet_id`),
  INDEX `idx_entry_project`     (`project_id`),
  INDEX `idx_entry_status`      (`status`),
  CONSTRAINT `fk_entry_sheet`
    FOREIGN KEY (`task_sheet_id`) REFERENCES `daily_task_sheets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_entry_project`
    FOREIGN KEY (`project_id`)    REFERENCES `projects` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_entry_task_type`
    FOREIGN KEY (`task_type_id`)  REFERENCES `task_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- View: vw_employee_man_days
-- Pre-aggregated employee-wise man-days per project per month.
-- Used by: admin employee-wise report, admin dashboard charts.
-- ============================================================
CREATE OR REPLACE VIEW `vw_employee_man_days` AS
SELECT
  e.id                                        AS employee_id,
  e.emp_code,
  e.emp_name,
  e.consultant_type,
  p.id                                        AS project_id,
  p.project_code,
  p.project_name,
  DATE_FORMAT(dts.sheet_date, '%Y-%m')        AS month,
  COUNT(DISTINCT dts.sheet_date)              AS days_filled,
  SUM(dts.total_hours)                        AS total_hours,
  ROUND(SUM(dts.total_hours) / 8, 2)          AS total_man_days
FROM `employees` e
  JOIN `daily_task_sheets` dts ON dts.employee_id = e.id
  LEFT JOIN `task_entries` te  ON te.task_sheet_id = dts.id
  LEFT JOIN `projects` p       ON p.id = te.project_id
WHERE dts.is_submitted = TRUE
GROUP BY e.id, p.id, DATE_FORMAT(dts.sheet_date, '%Y-%m');

-- ============================================================
-- View: vw_project_man_days
-- Pre-aggregated project-wise man-days by consultant type per month.
-- Used by: admin project-wise report, admin dashboard charts.
-- ============================================================
CREATE OR REPLACE VIEW `vw_project_man_days` AS
SELECT
  p.id                                        AS project_id,
  p.company_id                                AS company_id,
  p.project_code,
  p.project_name,
  p.project_type,
  e.consultant_type,
  DATE_FORMAT(dts.sheet_date, '%Y-%m')        AS month,
  COUNT(DISTINCT e.id)                        AS employee_count,
  SUM(te.duration_hours)                      AS total_hours,
  ROUND(SUM(te.duration_hours) / 8, 2)        AS total_man_days
FROM `projects` p
  JOIN `task_entries` te       ON te.project_id = p.id
  JOIN `daily_task_sheets` dts ON dts.id = te.task_sheet_id
  JOIN `employees` e           ON e.id = dts.employee_id
WHERE dts.is_submitted = TRUE
GROUP BY p.id, p.company_id, e.consultant_type, DATE_FORMAT(dts.sheet_date, '%Y-%m');

-- ============================================================
-- Done
-- ============================================================
SELECT 'Schema created successfully.' AS status;
