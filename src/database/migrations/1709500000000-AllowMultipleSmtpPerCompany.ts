import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowMultipleSmtpPerCompany1709500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add label column (idempotent — DDL auto-commits in MySQL)
    const [cols] = await queryRunner.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'smtp_configs' AND COLUMN_NAME = 'label'`,
    );
    if (!cols) {
      await queryRunner.query(
        `ALTER TABLE smtp_configs ADD COLUMN label VARCHAR(255) NULL AFTER company_id`,
      );
    }

    // Drop the FK constraint first (it depends on the unique index)
    const [fk] = await queryRunner.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'smtp_configs' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_smtp_company'`,
    );
    if (fk) {
      await queryRunner.query(
        `ALTER TABLE smtp_configs DROP FOREIGN KEY \`fk_smtp_company\``,
      );
    }

    // Drop the unique index on company_id
    const [uq] = await queryRunner.query(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'smtp_configs' AND INDEX_NAME = 'uq_smtp_company' LIMIT 1`,
    );
    if (uq) {
      await queryRunner.query(
        `ALTER TABLE smtp_configs DROP INDEX \`uq_smtp_company\``,
      );
    }

    // Add a regular index on company_id for lookups
    const [idx] = await queryRunner.query(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'smtp_configs' AND INDEX_NAME = 'IDX_smtp_configs_company_id' LIMIT 1`,
    );
    if (!idx) {
      await queryRunner.query(
        `CREATE INDEX \`IDX_smtp_configs_company_id\` ON smtp_configs (company_id)`,
      );
    }

    // Recreate the FK constraint (now backed by the regular index)
    const [fk2] = await queryRunner.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'smtp_configs' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_smtp_company'`,
    );
    if (!fk2) {
      await queryRunner.query(
        `ALTER TABLE smtp_configs ADD CONSTRAINT \`fk_smtp_company\` FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK
    await queryRunner.query(
      `ALTER TABLE smtp_configs DROP FOREIGN KEY \`fk_smtp_company\``,
    );

    // Drop regular index
    await queryRunner.query(
      `DROP INDEX \`IDX_smtp_configs_company_id\` ON smtp_configs`,
    );

    // Recreate unique index
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`uq_smtp_company\` ON smtp_configs (company_id)`,
    );

    // Recreate FK
    await queryRunner.query(
      `ALTER TABLE smtp_configs ADD CONSTRAINT \`fk_smtp_company\` FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE`,
    );

    // Drop label column
    await queryRunner.query(
      `ALTER TABLE smtp_configs DROP COLUMN label`,
    );
  }
}
