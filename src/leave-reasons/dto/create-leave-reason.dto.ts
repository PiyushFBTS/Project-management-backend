import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveTypeDto {
  @ApiProperty({ example: 'SL' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  reasonCode: string;

  @ApiProperty({ example: 'Sick Leave' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  reasonName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 12, description: 'Annual allowance in days (0 = uncapped)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  defaultDays?: number;
}
