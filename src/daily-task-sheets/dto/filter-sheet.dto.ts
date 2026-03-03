import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterSheetDto extends PaginationDto {
  @ApiPropertyOptional({ example: '2026-02-01', description: 'From date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-02-28', description: 'To date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}
