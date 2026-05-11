import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('stats')
  getStats() {
    return this.homeService.getStats();
  }

  @Get('recent')
  getRecent() {
    return this.homeService.getRecentListings();
  }

  @Get('featured')
  getFeatured() {
    return this.homeService.getFeaturedListings();
  }

  @Get('suburbs')
  getSuburbs() {
    return this.homeService.getSuburbs();
  }
}
