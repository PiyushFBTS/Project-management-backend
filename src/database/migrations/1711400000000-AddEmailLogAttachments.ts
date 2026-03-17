import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailLogAttachments1711400000000 implements MigrationInterface {
  name = 'AddEmailLogAttachments1711400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`email_logs\` ADD COLUMN \`attachments\` json DEFAULT NULL AFTER \`company_id\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`email_logs\` DROP COLUMN \`attachments\``,
    );
  }
}
