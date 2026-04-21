import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
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

  // Kept as string to sidestep enableImplicitConversion:true, which would
  // turn the 'false' query string into true via Boolean('false'). The
  // service parses this value explicitly.
  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : String(value)))
  @IsString()
  @IsOptional()
  isActive?: string;
}
