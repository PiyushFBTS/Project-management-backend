import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectManager1711500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`projects\`
      ADD COLUMN \`project_manager_id\` int DEFAULT NULL,
      ADD KEY \`IDX_project_manager\` (\`project_manager_id\`),
      ADD CONSTRAINT \`FK_project_manager\` FOREIGN KEY (\`project_manager_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`projects\` DROP FOREIGN KEY \`FK_project_manager\``);
    await queryRunner.query(`ALTER TABLE \`projects\` DROP KEY \`IDX_project_manager\``);
    await queryRunner.query(`ALTER TABLE \`projects\` DROP COLUMN \`project_manager_id\``);
  }
}
