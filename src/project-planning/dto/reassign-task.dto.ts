import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ReassignTaskDto {
  @ApiProperty({ description: 'Employee ID to reassign the task to' })
  @Type(() => Number)
  @IsInt()
  assigneeId: number;
}
