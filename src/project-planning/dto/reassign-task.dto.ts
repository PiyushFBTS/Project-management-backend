import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ReassignTaskDto {
  @ApiProperty({ description: 'ID of the person to reassign the task to' })
  @Type(() => Number)
  @IsInt()
  assigneeId: number;

  @ApiPropertyOptional({ description: 'Type of assignee: employee (default) or admin', enum: ['employee', 'admin'] })
  @IsOptional()
  @IsIn(['employee', 'admin'])
  assigneeType?: string;
}
