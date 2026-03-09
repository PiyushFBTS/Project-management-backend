import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClosedStatus1710000000000 implements MigrationInterface {
  name = 'AddClosedStatus1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`project_tasks\` MODIFY COLUMN \`status\` ENUM('todo','in_progress','in_review','done','closed') NOT NULL DEFAULT 'todo'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`project_tasks\` MODIFY COLUMN \`status\` ENUM('todo','in_progress','in_review','done') NOT NULL DEFAULT 'todo'`,
    );
  }
}
