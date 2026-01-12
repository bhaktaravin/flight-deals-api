import { Injectable } from '@nestjs/common';
import { MockFlightProvider } from 'src/providers/mock/mock.provider';
import { SearchFlightsDto } from './dto/search-flights.dto';
import { FlightOffer } from './models/flight-offer.model';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly provider: MockFlightProvider,
    private readonly prisma: PrismaService,
  ) {}

  async searchFlights(dto: SearchFlightsDto): Promise<FlightOffer[]> {
    // 1. Get results from provider
    const results = await this.provider.search(dto);

    // 2. Save search + results to DB
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

    // 3. Still return results to API caller
    return results;
  }
}
