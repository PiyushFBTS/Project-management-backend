import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Country } from '../database/entities/country.entity';
import { State } from '../database/entities/state.entity';
import { City } from '../database/entities/city.entity';
import { Currency } from '../database/entities/currency.entity';
import { PostalCode } from '../database/entities/postal-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Country, State, City, Currency, PostalCode])],
  providers: [LocationService],
  controllers: [LocationController],
  exports: [LocationService],
})
export class LocationModule {}
