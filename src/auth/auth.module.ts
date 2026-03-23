import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { JwtEmployeeStrategy } from './strategies/jwt-employee.strategy';
import { JwtClientStrategy } from './strategies/jwt-client.strategy';
import { AdminUser } from '../database/entities/admin-user.entity';
import { Employee } from '../database/entities/employee.entity';
import { Company } from '../database/entities/company.entity';
import { ClientUser } from '../database/entities/client-user.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([AdminUser, Employee, Company, ClientUser]),
  ],
  providers: [AuthService, JwtAdminStrategy, JwtEmployeeStrategy, JwtClientStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
