import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { AirportService } from './airport.service';
import { SearchFlightsDto } from './dto/search-flights.dto';

@Controller('search')
export class SearchController {
    constructor(
        private readonly searchService: SearchService,
        private readonly airportService: AirportService,
    ) {}

    @Post('flights')
    searchFlights(@Body() dto: SearchFlightsDto) {
        return this.searchService.searchFlights(dto);
    }

    @Get('airports')
    searchAirports(@Query('query') query: string) {
        return this.airportService.searchAirports(query);
    }
}
