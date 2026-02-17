import { Injectable, Inject } from '@nestjs/common';
import type { FlightProvider } from 'src/providers/provider.interface';
import { SearchFlightsDto } from './dto/search-flights.dto';
import { GetSearchHistoryDto } from './dto/get-search-history.dto';
import { FlightOffer } from './models/flight-offer.model';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    @Inject('FLIGHT_PROVIDER') private readonly provider: FlightProvider,
    private readonly prisma: PrismaService,
  ) {}

  async searchFlights(dto: SearchFlightsDto): Promise<FlightOffer[]> {
    // 1. Get results from provider
    const results = await this.provider.search(dto);

    // 2. Save search + results to DB
    try {
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
    } catch (error) {
      // Log error but don't fail the request if DB save fails
      console.error('Failed to save search to database:', error);
    }

    // 3. Still return results to API caller
    return results;
  }

  /**
   * Get search history with optional filters and pagination
   */
  async getSearchHistory(dto: GetSearchHistoryDto) {
    const { limit, offset, startDate, endDate, origin, destination } = dto;

    // Build where clause
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (origin) where.origin = origin;
    if (destination) where.destination = destination;

    // Get total count
    const total = await this.prisma.flightSearch.count({ where });

    // Get searches with results
    const searches = await this.prisma.flightSearch.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        results: {
          select: {
            id: true,
            provider: true,
            price: true,
            currency: true,
            durationMinutes: true,
            stops: true,
          },
          orderBy: { price: 'asc' },
          take: 5, // Only include top 5 cheapest results per search
        },
      },
    });

    return {
      data: searches,
      pagination: {
        total,
        limit: limit || 10,
        offset: offset || 0,
        hasMore: (offset || 0) + (limit || 10) < total,
      },
    };
  }

  /**
   * Get a single search by ID with all results and segments
   */
  async getSearchById(id: string) {
    const search = await this.prisma.flightSearch.findUnique({
      where: { id },
      include: {
        results: {
          include: {
            segments: {
              orderBy: { departAt: 'asc' },
            },
          },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!search) {
      throw new Error(`Search with ID ${id} not found`);
    }

    return search;
  }

  /**
   * Get popular routes based on search frequency
   */
  async getPopularRoutes(limit: number = 10) {
    const routes = await this.prisma.flightSearch.groupBy({
      by: ['origin', 'destination'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    return routes.map((route) => ({
      origin: route.origin,
      destination: route.destination,
      searchCount: route._count.id,
    }));
  }
}
