import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminLeaveSupport1711100000000 implements MigrationInterface {
  name = 'AddAdminLeaveSupport1711100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make employee_id nullable so admins can submit leave without an employee record
    await queryRunner.query(
      `ALTER TABLE \`leave_requests\` MODIFY COLUMN \`employee_id\` INT NULL`,
    );
    // Add admin_id column
    await queryRunner.query(
      `ALTER TABLE \`leave_requests\` ADD COLUMN \`admin_id\` INT NULL AFTER \`employee_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`leave_requests\` ADD CONSTRAINT \`FK_leave_request_admin\` FOREIGN KEY (\`admin_id\`) REFERENCES \`admin_users\`(\`id\`) ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_leave_request_admin\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`leave_requests\` DROP COLUMN \`admin_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`leave_requests\` MODIFY COLUMN \`employee_id\` INT NOT NULL`,
    );
  }
}
