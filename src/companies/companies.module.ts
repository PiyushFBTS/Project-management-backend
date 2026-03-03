import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from '../database/entities/company.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { Employee } from '../database/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, AdminUser, Employee])],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
