import { IsEnum, IsInt, IsNotEmpty, IsPositive, IsString, MinLength, Matches, MaxLength, ValidateIf, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../../database/entities/task-entry.entity';

export class CreateEntryDto {
  @ApiPropertyOptional({ description: 'Project ID (required unless otherProjectName is provided)' })
  @ValidateIf((o) => !o.otherProjectName)
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  projectId?: number;

  @ApiPropertyOptional({ description: 'Custom project name when "Other" is selected' })
  @ValidateIf((o) => !o.projectId)
  @IsString()
  @IsNotEmpty({ message: 'Project name is required when "Other" is selected' })
  @MaxLength(255)
  otherProjectName?: string;

  @ApiPropertyOptional({ description: 'Task type ID (optional)' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  taskTypeId?: number;

  @ApiProperty({ example: '09:00', description: 'Task start time (HH:MM)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'fromTime must be in HH:MM format' })
  fromTime: string;

  @ApiProperty({ example: '12:30', description: 'Task end time (HH:MM)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'toTime must be in HH:MM format' })
  toTime: string;

  @ApiProperty({ example: 'Implemented login module and unit tests', minLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  taskDescription: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus = TaskStatus.IN_PROGRESS;
}
