import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { JwtEmployeeStrategy } from './strategies/jwt-employee.strategy';
import { AdminUser } from '../database/entities/admin-user.entity';
import { Employee } from '../database/entities/employee.entity';
import { Company } from '../database/entities/company.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}), // Secrets are set per sign/verify call — not globally
    TypeOrmModule.forFeature([AdminUser, Employee, Company]),
  ],
  providers: [AuthService, JwtAdminStrategy, JwtEmployeeStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
