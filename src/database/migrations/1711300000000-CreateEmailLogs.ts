import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailLogs1711300000000 implements MigrationInterface {
  name = 'CreateEmailLogs1711300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`email_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`subject\` varchar(500) DEFAULT NULL,
        \`body\` longtext DEFAULT NULL,
        \`to_email\` varchar(255) NOT NULL,
        \`from_email\` varchar(255) DEFAULT NULL,
        \`from_name\` varchar(255) DEFAULT NULL,
        \`triggered_by\` varchar(100) DEFAULT NULL,
        \`status\` enum('sent','failed') NOT NULL DEFAULT 'sent',
        \`error_message\` text DEFAULT NULL,
        \`company_id\` int DEFAULT NULL,
        \`sent_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_email_logs_company\` (\`company_id\`),
        KEY \`IDX_email_logs_sent_at\` (\`sent_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`email_logs\``);
  }
}
