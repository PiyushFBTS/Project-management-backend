import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicHoliday } from '../database/entities/public-holiday.entity';
import { HolidaysAdminController, HolidaysEmployeeController } from './holidays.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PublicHoliday])],
  controllers: [HolidaysAdminController, HolidaysEmployeeController],
})
export class HolidaysModule {}
