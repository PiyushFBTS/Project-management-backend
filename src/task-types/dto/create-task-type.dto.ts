import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskCategory } from '../../database/entities/task-type.entity';

export class CreateTaskTypeDto {
  @ApiProperty({ example: 'TT-PC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  typeCode: string;

  @ApiProperty({ example: 'Project Customization' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  typeName: string;

  @ApiProperty({ enum: TaskCategory })
  @IsEnum(TaskCategory)
  category: TaskCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
