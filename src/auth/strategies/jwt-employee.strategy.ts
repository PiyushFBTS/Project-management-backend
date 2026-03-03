import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../database/entities/employee.entity';

export interface EmployeeJwtPayload {
  sub: number;
  email: string;
  consultantType: string;
  companyId: number;
  type: string;
}

@Injectable()
export class JwtEmployeeStrategy extends PassportStrategy(
  Strategy,
  'jwt-employee',
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_EMPLOYEE_SECRET'),
    });
  }

  async validate(payload: EmployeeJwtPayload): Promise<Employee> {
    if (payload.type !== 'employee') throw new UnauthorizedException();
    const employee = await this.employeeRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });
    if (!employee)
      throw new UnauthorizedException('Employee account not found or inactive');
    return employee;
  }
}
