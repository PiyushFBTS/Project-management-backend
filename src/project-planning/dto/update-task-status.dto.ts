import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectTaskStatus } from '../../database/entities/project-task.entity';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: ProjectTaskStatus })
  @IsEnum(ProjectTaskStatus)
  status: ProjectTaskStatus;
}
