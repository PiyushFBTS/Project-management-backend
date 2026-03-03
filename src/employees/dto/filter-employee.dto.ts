import { IsBoolean, IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ConsultantType } from '../../database/entities/employee.entity';

export class FilterEmployeeDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ConsultantType })
  @IsEnum(ConsultantType)
  @IsOptional()
  consultantType?: ConsultantType;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  assignedProjectId?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
