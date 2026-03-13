import { PartialType } from '@nestjs/swagger';
import { CreateLeaveTypeDto } from './create-leave-reason.dto';

export class UpdateLeaveTypeDto extends PartialType(CreateLeaveTypeDto) {}
