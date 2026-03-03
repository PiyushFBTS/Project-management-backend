import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { LeaveRequestStatus } from '../../database/entities/leave-request.entity';

export class FilterLeaveRequestDto extends PaginationDto {
  @ApiPropertyOptional({ enum: LeaveRequestStatus })
  @IsEnum(LeaveRequestStatus)
  @IsOptional()
  status?: LeaveRequestStatus;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  employeeId?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
