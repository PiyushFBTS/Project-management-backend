import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveReasonDto {
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
}
