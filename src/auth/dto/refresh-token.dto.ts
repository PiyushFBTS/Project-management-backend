import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiPropertyOptional({ enum: ['admin', 'employee', 'client'], default: 'admin' })
  @IsIn(['admin', 'employee', 'client'])
  @IsOptional()
  type?: 'admin' | 'employee' | 'client' = 'admin';
}
