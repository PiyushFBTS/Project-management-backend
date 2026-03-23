import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddTaskAttachments1712700000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.createTable(
      new Table({
        name: 'task_attachments',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'task_id', type: 'int' },
          { name: 'file_name', type: 'varchar', length: '300' },
          { name: 'original_name', type: 'varchar', length: '500' },
          { name: 'file_path', type: 'varchar', length: '500' },
          { name: 'file_size', type: 'int' },
          { name: 'mime_type', type: 'varchar', length: '100' },
          { name: 'uploaded_by_name', type: 'varchar', length: '200' },
          { name: 'company_id', type: 'int' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await qr.createIndex('task_attachments', new TableIndex({ name: 'idx_tattach_task', columnNames: ['task_id'] }));
    await qr.createIndex('task_attachments', new TableIndex({ name: 'idx_tattach_company', columnNames: ['company_id'] }));

    await qr.createForeignKey('task_attachments', new TableForeignKey({
      columnNames: ['task_id'], referencedTableName: 'project_tasks', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));
    await qr.createForeignKey('task_attachments', new TableForeignKey({
      columnNames: ['company_id'], referencedTableName: 'companies', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.dropTable('task_attachments', true);
  }
}
