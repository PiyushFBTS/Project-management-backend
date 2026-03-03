import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSheetDto {
  @ApiPropertyOptional({ description: 'Optional overall remarks for the day' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
