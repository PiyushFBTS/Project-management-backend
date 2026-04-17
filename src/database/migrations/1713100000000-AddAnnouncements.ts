import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddAnnouncements1713100000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.createTable(
      new Table({
        name: 'announcements',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'title', type: 'varchar', length: '200' },
          { name: 'description', type: 'text' },
          { name: 'expires_on', type: 'date' },
          { name: 'is_active', type: 'tinyint', default: 1 },
          { name: 'created_by_id', type: 'int' },
          { name: 'created_by_type', type: 'enum', enum: ['admin', 'employee'] },
          { name: 'created_by_name', type: 'varchar', length: '150' },
          { name: 'company_id', type: 'int' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await qr.createIndex('announcements', new TableIndex({ name: 'idx_announcement_company', columnNames: ['company_id'] }));
    await qr.createIndex('announcements', new TableIndex({ name: 'idx_announcement_expires', columnNames: ['expires_on'] }));

    await qr.createForeignKey('announcements', new TableForeignKey({
      columnNames: ['company_id'], referencedTableName: 'companies', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.dropTable('announcements', true);
  }
}
