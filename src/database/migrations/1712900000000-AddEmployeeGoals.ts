import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddEmployeeGoals1712900000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.createTable(
      new Table({
        name: 'employee_goals',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'employee_id', type: 'int' },
          { name: 'company_id', type: 'int' },
          { name: 'title', type: 'varchar', length: '200' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'timeframe', type: 'enum', enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'], default: "'monthly'" },
          { name: 'progress_percent', type: 'int', default: 0 },
          { name: 'target_date', type: 'date', isNullable: true },
          { name: 'status', type: 'enum', enum: ['active', 'completed', 'dropped'], default: "'active'" },
          { name: 'created_by_id', type: 'int' },
          { name: 'created_by_type', type: 'enum', enum: ['admin', 'employee'] },
          { name: 'created_by_name', type: 'varchar', length: '150' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await qr.createIndex('employee_goals', new TableIndex({ name: 'idx_goal_employee', columnNames: ['employee_id'] }));
    await qr.createIndex('employee_goals', new TableIndex({ name: 'idx_goal_company', columnNames: ['company_id'] }));

    await qr.createForeignKey('employee_goals', new TableForeignKey({
      columnNames: ['company_id'], referencedTableName: 'companies', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.dropTable('employee_goals', true);
  }
}
