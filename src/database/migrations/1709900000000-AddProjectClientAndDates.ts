import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectClientAndDates1709900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`projects\`
         ADD COLUMN \`client_name\` VARCHAR(200) NULL AFTER \`project_type\`,
         ADD COLUMN \`start_date\` DATE NULL AFTER \`status\`,
         ADD COLUMN \`end_date\` DATE NULL AFTER \`start_date\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`projects\`
         DROP COLUMN \`end_date\`,
         DROP COLUMN \`start_date\`,
         DROP COLUMN \`client_name\``,
    );
  }
}
