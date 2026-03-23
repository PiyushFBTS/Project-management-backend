import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignedClientId1712600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`project_tasks\`
      ADD COLUMN \`assigned_client_id\` int DEFAULT NULL AFTER \`assigned_admin_id\`,
      ADD KEY \`idx_task_client\` (\`assigned_client_id\`),
      ADD CONSTRAINT \`fk_task_client\` FOREIGN KEY (\`assigned_client_id\`) REFERENCES \`client_users\` (\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`project_tasks\`
      DROP FOREIGN KEY \`fk_task_client\`,
      DROP KEY \`idx_task_client\`,
      DROP COLUMN \`assigned_client_id\`
    `);
  }
}
