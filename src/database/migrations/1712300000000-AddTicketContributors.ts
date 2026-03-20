import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketContributors1712300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`ticket_contributors\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`task_id\` int NOT NULL,
        \`employee_id\` int NOT NULL,
        \`company_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_contributor\` (\`task_id\`, \`employee_id\`),
        KEY \`idx_contributor_task\` (\`task_id\`),
        KEY \`idx_contributor_company\` (\`company_id\`),
        CONSTRAINT \`fk_contributor_task\` FOREIGN KEY (\`task_id\`) REFERENCES \`project_tasks\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_contributor_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_contributor_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `ticket_contributors`');
  }
}
