import { Body, Controller, Post } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchFlightsDto } from './dto/search-flights.dto';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Post('flights')
    searchFlights(@Body() dto: SearchFlightsDto) {
        return this.searchService.searchFlights(dto);
    }
}
