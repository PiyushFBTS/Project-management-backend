import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActionLeaveRequestDto {
  @ApiPropertyOptional({ example: 'Approved — enjoy your time off' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  remarks?: string;
}
