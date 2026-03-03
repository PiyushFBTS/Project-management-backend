import {
  IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional,
  IsPositive, IsString, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveRequestDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  leaveReasonId: number;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  @IsNotEmpty()
  dateFrom: string;

  @ApiProperty({ example: '2026-03-03' })
  @IsDateString()
  @IsNotEmpty()
  dateTo: string;

  @ApiPropertyOptional({ example: 'Family function' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Employee IDs who can view this request', example: [2, 5] })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @IsOptional()
  watcherIds?: number[];
}
