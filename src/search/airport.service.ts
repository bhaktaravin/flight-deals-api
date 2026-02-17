import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RedisService } from '../redis/redis.service';
import { AmadeusAuthService } from '../providers/amadeus/amadeus-auth.service';
import { AmadeusLocationResponse } from '../providers/amadeus/types/amadeus-response.types';
import { ExternalApiException } from '../common/exceptions/business.exception';

export interface AirportResult {
  code: string;
  name: string;
  city: string;
  country: string;
}

@Injectable()
export class AirportService {
  private readonly logger = new Logger(AirportService.name);
  private readonly baseUrl: string;
  private readonly CACHE_TTL = 604800; // 7 days in seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly redis: RedisService,
    private readonly authService: AmadeusAuthService,
  ) {
    this.baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
  }

  /**
   * Search for airports with caching
   */
  async searchAirports(query: string): Promise<AirportResult[]> {
    const normalized = query.toLowerCase().trim();

    if (normalized.length < 2) {
      return [];
    }

    const cacheKey = `airports:${normalized}`;

    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for airport search: ${normalized}`);
      return JSON.parse(cached);
    }

    this.logger.log(`Fetching airports from Amadeus for query: ${normalized}`);

    try {
      // Get auth token
      const token = await this.authService.getToken();

      // Call Amadeus Airport & City Search API
      const response = await firstValueFrom(
        this.httpService.get<AmadeusLocationResponse>(
          `${this.baseUrl}/v1/reference-data/locations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              keyword: normalized,
              subType: 'AIRPORT,CITY',
              'page[limit]': 10,
            },
          },
        ),
      );

      // Transform to simplified format
      const results = this.transformAirports(response.data);

      // Cache for 7 days
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(results));

      this.logger.debug(`Cached ${results.length} airports for query: ${normalized}`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch airports for query: ${normalized}`, error);

      // Re-throw ExternalApiException from auth service
      if (error instanceof ExternalApiException) {
        throw error;
      }

      // Handle errors gracefully
      if (error.response?.status === 401) {
        await this.authService.clearToken();
        throw new ExternalApiException(
          'Authentication failed. Please try again.',
          'amadeus',
          503,
        );
      }

      throw new ExternalApiException(
        'Unable to search airports at this time. Please try again.',
        'amadeus',
        503,
      );
    }
  }

  /**
   * Transform Amadeus locations to simplified airport results
   */
  private transformAirports(response: AmadeusLocationResponse): AirportResult[] {
    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map((location) => ({
      code: location.iataCode,
      name: location.name,
      city: location.address.cityName,
      country: location.address.countryCode,
    }));
  }
}
