import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TaskPriority, ProjectTaskStatus } from '../../database/entities/project-task.entity';

export class FilterTasksDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by ticket number suffix' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ProjectTaskStatus })
  @IsEnum(ProjectTaskStatus)
  @IsOptional()
  status?: ProjectTaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  assigneeId?: number;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  projectId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  phaseId?: number;
}
