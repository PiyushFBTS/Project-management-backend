import { IsString, IsNumber, IsOptional, IsDateString, IsPositive, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({ example: '2026-03-27' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ example: '2026-03-31', description: 'End date for range/month expenses' })
  @IsDateString()
  @IsOptional()
  expenseDateTo?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  projectId?: number;

  @ApiProperty({ example: 'travel' })
  @IsString()
  expenseType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1500.00 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class UpdateExpenseStatusDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsString()
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: 'Approved amount (can differ from requested)' })
  @Type(() => Number)
  @IsOptional()
  approvedAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateExpensePaidDto {
  @ApiProperty({ description: 'Mark expense as paid (true) or unpaid (false)' })
  @IsBoolean()
  paid: boolean;
}
