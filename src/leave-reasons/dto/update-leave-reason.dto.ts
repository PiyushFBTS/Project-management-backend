import { PartialType } from '@nestjs/swagger';
import { CreateLeaveReasonDto } from './create-leave-reason.dto';

export class UpdateLeaveReasonDto extends PartialType(CreateLeaveReasonDto) {}
