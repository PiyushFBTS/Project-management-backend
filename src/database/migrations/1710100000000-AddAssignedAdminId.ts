import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignedAdminId1710100000000 implements MigrationInterface {
  name = 'AddAssignedAdminId1710100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`project_tasks\` ADD COLUMN \`assigned_admin_id\` INT NULL AFTER \`assignee_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_tasks\` ADD CONSTRAINT \`FK_task_assigned_admin\` FOREIGN KEY (\`assigned_admin_id\`) REFERENCES \`admin_users\`(\`id\`) ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`project_tasks\` DROP FOREIGN KEY \`FK_task_assigned_admin\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_tasks\` DROP COLUMN \`assigned_admin_id\``,
    );
  }
}
