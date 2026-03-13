import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactPersonName1711000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE companies ADD COLUMN contact_person_name VARCHAR(150) NULL AFTER postal_code`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE companies DROP COLUMN contact_person_name`,
    );
  }
}
