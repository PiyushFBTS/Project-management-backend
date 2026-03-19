import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBirthdayAndJoiningDate1712000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`employees\`
      ADD COLUMN \`date_of_birth\` date DEFAULT NULL,
      ADD COLUMN \`joining_date\` date DEFAULT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`admin_users\`
      ADD COLUMN \`date_of_birth\` date DEFAULT NULL,
      ADD COLUMN \`joining_date\` date DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`employees\` DROP COLUMN \`joining_date\`, DROP COLUMN \`date_of_birth\``);
    await queryRunner.query(`ALTER TABLE \`admin_users\` DROP COLUMN \`joining_date\`, DROP COLUMN \`date_of_birth\``);
  }
}
