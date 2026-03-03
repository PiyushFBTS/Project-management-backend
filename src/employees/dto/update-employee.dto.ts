import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

// password is excluded from updates — use change-password endpoint instead
export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['password'] as const),
) {}
