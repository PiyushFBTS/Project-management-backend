import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectTypes1709800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`projects\` MODIFY COLUMN \`project_type\` ENUM('project','support','development','consulting','migration','maintenance') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`projects\` MODIFY COLUMN \`project_type\` ENUM('project','support') NOT NULL`,
    );
  }
}