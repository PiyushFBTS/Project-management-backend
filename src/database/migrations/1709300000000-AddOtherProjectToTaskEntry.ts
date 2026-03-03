import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtherProjectToTaskEntry1709300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing FK so we can modify the column
    await queryRunner.query(`ALTER TABLE task_entries DROP FOREIGN KEY \`fk_entry_project\``);

    // Make project_id nullable + add other_project_name column
    await queryRunner.query(`
      ALTER TABLE task_entries
        MODIFY COLUMN project_id INT NULL,
        ADD COLUMN other_project_name VARCHAR(255) NULL AFTER project_id
    `);

    // Re-add FK with SET NULL on delete
    await queryRunner.query(`
      ALTER TABLE task_entries
        ADD CONSTRAINT \`fk_entry_project\`
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE task_entries DROP FOREIGN KEY \`fk_entry_project\``);

    // Remove other_project_name and make project_id NOT NULL again
    await queryRunner.query(`
      ALTER TABLE task_entries
        DROP COLUMN other_project_name,
        MODIFY COLUMN project_id INT NOT NULL
    `);

    // Restore original FK with RESTRICT
    await queryRunner.query(`
      ALTER TABLE task_entries
        ADD CONSTRAINT \`fk_entry_project\`
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
    `);
  }
}
