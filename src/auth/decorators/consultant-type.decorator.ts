import { SetMetadata } from '@nestjs/common';
import { ConsultantType } from '../../database/entities/employee.entity';

export const CONSULTANT_TYPES_KEY = 'consultantTypes';
export const ConsultantTypes = (...types: ConsultantType[]) =>
  SetMetadata(CONSULTANT_TYPES_KEY, types);
