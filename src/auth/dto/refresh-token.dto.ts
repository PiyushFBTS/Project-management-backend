import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiPropertyOptional({ enum: ['admin', 'employee'], default: 'admin' })
  @IsIn(['admin', 'employee'])
  @IsOptional()
  type?: 'admin' | 'employee' = 'admin';
}
