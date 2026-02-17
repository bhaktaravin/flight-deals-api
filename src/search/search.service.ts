import { Injectable, Inject } from '@nestjs/common';
import type { FlightProvider } from 'src/providers/provider.interface';
import { SearchFlightsDto } from './dto/search-flights.dto';
import { FlightOffer } from './models/flight-offer.model';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    @Inject('FLIGHT_PROVIDER') private readonly provider: FlightProvider,
    // private readonly prisma: PrismaService, // Temporarily disabled
  ) {}

  async searchFlights(dto: SearchFlightsDto): Promise<FlightOffer[]> {
    // 1. Get results from provider
    const results = await this.provider.search(dto);

    // 2. Save search + results to DB (temporarily disabled for testing)
    // TODO: Re-enable after starting Docker with: docker-compose up -d
    /*
    await this.prisma.flightSearch.create({
      data: {
        origin: dto.origin,
        destination: dto.destination,
        departDate: new Date(dto.departDate),
        passengers: dto.passengers,
        results: {
          create: results.map((r) => ({
            provider: r.provider,
            price: r.price,
            currency: r.currency,
            durationMinutes: r.durationMinutes,
            stops: r.stops,
            segments: {
              create: r.segments.map((s) => ({
                from: s.from,
                to: s.to,
                departAt: new Date(s.departAt),
                arriveAt: new Date(s.arriveAt),
                carrier: s.carrier,
                flightNumber: s.flightNumber,
              })),
            },
          })),
        },
      },
    });
    */

    // 3. Still return results to API caller
    return results;
  }
}
