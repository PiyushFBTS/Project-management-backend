import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectTaskStatus } from '../../database/entities/project-task.entity';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: ProjectTaskStatus })
  @IsEnum(ProjectTaskStatus)
  status: ProjectTaskStatus;

  @ApiPropertyOptional({ description: 'Admin ID to assign to when closing the ticket' })
  @IsOptional()
  @IsNumber()
  assignToAdminId?: number;
}
