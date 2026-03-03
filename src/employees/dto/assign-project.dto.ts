import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignProjectDto {
  @ApiPropertyOptional({ description: 'Project ID to assign. Pass null to unassign.' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  projectId?: number | null;
}
