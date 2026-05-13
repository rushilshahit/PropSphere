import { Controller, Get, Query, ParseFloatPipe } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('street-view-check')
  checkStreetView(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ) {
    return this.mapsService.checkStreetView(lat, lng);
  }
}
