import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskHistory1710200000000 implements MigrationInterface {
  name = 'AddTaskHistory1710200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`project_task_history\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`task_id\` INT NOT NULL,
        \`action\` ENUM('created','status_changed','assigned','reassigned','closed','priority_changed','updated') NOT NULL,
        \`performed_by_id\` INT NOT NULL,
        \`performed_by_type\` ENUM('admin','employee') NOT NULL,
        \`performed_by_name\` VARCHAR(200) NOT NULL,
        \`old_value\` VARCHAR(500) NULL,
        \`new_value\` VARCHAR(500) NULL,
        \`details\` TEXT NULL,
        \`company_id\` INT NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_history_task\` (\`task_id\`),
        INDEX \`idx_history_company\` (\`company_id\`),
        CONSTRAINT \`FK_history_task\` FOREIGN KEY (\`task_id\`) REFERENCES \`project_tasks\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_history_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`project_task_history\``);
  }
}
