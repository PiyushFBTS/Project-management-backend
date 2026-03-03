import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSmtpConfigs1709400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE smtp_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NULL,
        host VARCHAR(255) NOT NULL,
        port INT NOT NULL DEFAULT 587,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(500) NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255) NULL,
        encryption ENUM('tls', 'ssl', 'none') NOT NULL DEFAULT 'tls',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY uq_smtp_company (company_id),
        CONSTRAINT fk_smtp_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS smtp_configs`);
  }
}
