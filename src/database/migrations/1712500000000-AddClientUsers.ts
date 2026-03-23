import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientUsers1712500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`client_users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`full_name\` varchar(150) NOT NULL,
        \`email\` varchar(150) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`mobile_number\` varchar(20) DEFAULT NULL,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`project_id\` int NOT NULL,
        \`company_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`idx_client_email\` (\`email\`),
        KEY \`idx_client_project\` (\`project_id\`),
        KEY \`idx_client_company\` (\`company_id\`),
        CONSTRAINT \`fk_client_project\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_client_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `client_users`');
  }
}
