import { IsString, IsOptional, IsInt, IsDateString, IsEnum, MaxLength, Min } from 'class-validator';
import { SubscriptionPlan } from '../../database/entities/company.entity';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  userLimit?: number;

  @IsDateString()
  licenseExpiryDate: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;
}
