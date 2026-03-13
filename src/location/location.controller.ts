import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';

@ApiTags('Location & Currency')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('lookup')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List all countries' })
  getCountries() {
    return this.locationService.getCountries();
  }

  @Get('states/:countryId')
  @ApiOperation({ summary: 'List states for a country' })
  getStates(@Param('countryId', ParseIntPipe) countryId: number) {
    return this.locationService.getStates(countryId);
  }

  @Get('cities/:stateId')
  @ApiOperation({ summary: 'List cities for a state' })
  getCities(@Param('stateId', ParseIntPipe) stateId: number) {
    return this.locationService.getCities(stateId);
  }

  @Get('currencies')
  @ApiOperation({ summary: 'List all active currencies' })
  getCurrencies() {
    return this.locationService.getCurrencies();
  }

  @Get('postal-codes/:cityId')
  @ApiOperation({ summary: 'List postal/pin codes for a city' })
  getPostalCodes(@Param('cityId', ParseIntPipe) cityId: number) {
    return this.locationService.getPostalCodes(cityId);
  }
}
