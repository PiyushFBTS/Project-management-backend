import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectDocuments1712400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`project_documents\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`project_id\` int NOT NULL,
        \`fileName\` varchar(300) NOT NULL,
        \`original_name\` varchar(500) NOT NULL,
        \`file_path\` varchar(500) NOT NULL,
        \`file_size\` int NOT NULL,
        \`mime_type\` varchar(100) NOT NULL,
        \`category\` enum('project_plan','frd','commercial','other') NOT NULL DEFAULT 'other',
        \`uploaded_by_name\` varchar(200) NOT NULL,
        \`company_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`idx_doc_project\` (\`project_id\`),
        KEY \`idx_doc_company\` (\`company_id\`),
        CONSTRAINT \`fk_doc_project\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_doc_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `project_documents`');
  }
}
