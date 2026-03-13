import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../database/entities/country.entity';
import { State } from '../database/entities/state.entity';
import { City } from '../database/entities/city.entity';
import { Currency } from '../database/entities/currency.entity';
import { PostalCode } from '../database/entities/postal-code.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(State)
    private readonly stateRepo: Repository<State>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(PostalCode)
    private readonly postalCodeRepo: Repository<PostalCode>,
  ) {}

  async getCountries() {
    return this.countryRepo.find({ order: { name: 'ASC' } });
  }

  async getStates(countryId: number) {
    return this.stateRepo.find({
      where: { countryId },
      order: { name: 'ASC' },
    });
  }

  async getCities(stateId: number) {
    return this.cityRepo.find({
      where: { stateId },
      order: { name: 'ASC' },
    });
  }

  async getCurrencies() {
    return this.currencyRepo.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }

  async getPostalCodes(cityId: number) {
    return this.postalCodeRepo.find({
      where: { cityId },
      order: { code: 'ASC' },
    });
  }
}
