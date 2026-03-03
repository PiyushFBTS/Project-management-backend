import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { SubscriptionPlan } from '../../database/entities/company.entity';

export class UpdateLicenseDto {
  @IsOptional()
  @IsDateString()
  licenseExpiryDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  userLimit?: number;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;

  @IsOptional()
  @IsDateString()
  subscriptionStart?: string;
}
