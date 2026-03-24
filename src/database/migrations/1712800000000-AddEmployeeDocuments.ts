import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddEmployeeDocuments1712800000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.createTable(
      new Table({
        name: 'employee_documents',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'user_type', type: 'varchar', length: '20' },
          { name: 'user_id', type: 'int' },
          { name: 'file_name', type: 'varchar', length: '300' },
          { name: 'original_name', type: 'varchar', length: '500' },
          { name: 'file_path', type: 'varchar', length: '500' },
          { name: 'file_size', type: 'int' },
          { name: 'mime_type', type: 'varchar', length: '100' },
          { name: 'category', type: 'enum', enum: ['aadhaar', 'pan', 'joining', 'exit', 'other'], default: "'other'" },
          { name: 'uploaded_by_name', type: 'varchar', length: '200' },
          { name: 'company_id', type: 'int' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await qr.createIndex('employee_documents', new TableIndex({ name: 'idx_empdoc_user', columnNames: ['user_id'] }));
    await qr.createIndex('employee_documents', new TableIndex({ name: 'idx_empdoc_company', columnNames: ['company_id'] }));

    await qr.createForeignKey('employee_documents', new TableForeignKey({
      columnNames: ['company_id'], referencedTableName: 'companies', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.dropTable('employee_documents', true);
  }
}
