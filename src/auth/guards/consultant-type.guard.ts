import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CONSULTANT_TYPES_KEY } from '../decorators/consultant-type.decorator';
import { ConsultantType } from '../../database/entities/employee.entity';

@Injectable()
export class ConsultantTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<ConsultantType[]>(
      CONSULTANT_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;
    const { user } = context.switchToHttp().getRequest();
    return required.includes(user?.consultantType);
  }
}
