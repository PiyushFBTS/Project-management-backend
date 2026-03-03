import { IsOptional, IsString, IsInt, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SubscriptionPlan } from '../../database/entities/company.entity';

export class FilterCompanyDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
