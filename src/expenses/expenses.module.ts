import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../database/entities/expense.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesEmployeeController } from './expenses-employee.controller';
import { ExpensesAdminController } from './expenses-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],
  providers: [ExpensesService],
  controllers: [ExpensesEmployeeController, ExpensesAdminController],
})
export class ExpensesModule {}
