import { Body, Controller, Post, Get, Query, Param } from '@nestjs/common';
import { SearchService } from './search.service';
import { AirportService } from './airport.service';
import { SearchFlightsDto } from './dto/search-flights.dto';
import { GetSearchHistoryDto } from './dto/get-search-history.dto';

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

    @Get('history')
    getSearchHistory(@Query() dto: GetSearchHistoryDto) {
        return this.searchService.getSearchHistory(dto);
    }

    @Get('history/:id')
    getSearchById(@Param('id') id: string) {
        return this.searchService.getSearchById(id);
    }

    @Get('popular-routes')
    getPopularRoutes(@Query('limit') limit?: number) {
        return this.searchService.getPopularRoutes(limit ? parseInt(limit.toString()) : 10);
    }
}
