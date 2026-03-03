import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhaseStatus } from '../../database/entities/project-phase.entity';

export class CreatePhaseDto {
  @ApiProperty({ example: 'Design Phase' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-04-01' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: PhaseStatus, default: PhaseStatus.NOT_STARTED })
  @IsEnum(PhaseStatus)
  @IsOptional()
  status?: PhaseStatus;
}
