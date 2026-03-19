import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectManagerToAdmin1711600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old FK pointing to employees
    await queryRunner.query(`ALTER TABLE \`projects\` DROP FOREIGN KEY \`FK_project_manager\``);
    // Re-add FK pointing to admin_users
    await queryRunner.query(`
      ALTER TABLE \`projects\`
      ADD CONSTRAINT \`FK_project_manager\` FOREIGN KEY (\`project_manager_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`projects\` DROP FOREIGN KEY \`FK_project_manager\``);
    await queryRunner.query(`
      ALTER TABLE \`projects\`
      ADD CONSTRAINT \`FK_project_manager\` FOREIGN KEY (\`project_manager_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL
    `);
  }
}
