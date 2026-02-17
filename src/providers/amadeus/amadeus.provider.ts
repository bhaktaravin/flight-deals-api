import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FlightProvider } from '../provider.interface';
import { SearchFlightsDto } from '../../search/dto/search-flights.dto';
import { FlightOffer } from '../../search/models/flight-offer.model';
import { AmadeusAuthService } from './amadeus-auth.service';
import { AmadeusTransformService } from './amadeus-transform.service';
import { AmadeusFlightOffersResponse } from './types/amadeus-response.types';

@Injectable()
export class AmadeusProvider implements FlightProvider {
  private readonly logger = new Logger(AmadeusProvider.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: AmadeusAuthService,
    private readonly transformService: AmadeusTransformService,
  ) {
    this.baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
  }

  /**
   * Search for flights using Amadeus Flight Offers Search API
   */
  async search(dto: SearchFlightsDto): Promise<FlightOffer[]> {
    this.logger.log(`Searching flights: ${dto.origin} -> ${dto.destination} on ${dto.departDate}`);

    try {
      // 1. Get authentication token
      const token = await this.authService.getToken();

      // 2. Build request parameters
      const params: any = {
        originLocationCode: dto.origin,
        destinationLocationCode: dto.destination,
        departureDate: dto.departDate,
        adults: dto.passengers,
        currencyCode: 'USD',
        max: 50, // Maximum results to return
        nonStop: false, // Include flights with stops
      };

      // Add return date if provided (round trip)
      if (dto.returnDate) {
        params.returnDate = dto.returnDate;
      }

      // 3. Call Amadeus Flight Offers Search API
      const response = await firstValueFrom(
        this.httpService.get<AmadeusFlightOffersResponse>(
          `${this.baseUrl}/v2/shopping/flight-offers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params,
          },
        ),
      );

      this.logger.debug(`Amadeus returned ${response.data.data.length} flight offers`);

      // 4. Transform response to FlightOffer format
      const flightOffers = this.transformService.transform(response.data);

      this.logger.log(`Successfully transformed ${flightOffers.length} flight offers`);
      return flightOffers;
    } catch (error) {
      this.logger.error('Failed to search flights from Amadeus', error);

      // Handle specific HTTP errors
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            throw new Error(`Invalid request: ${JSON.stringify(data)}`);
          case 401:
            // Clear cached token and let the next request fetch a new one
            await this.authService.clearToken();
            throw new Error('Authentication failed. Please try again.');
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          case 500:
          case 502:
          case 503:
            throw new Error('Amadeus API is temporarily unavailable. Please try again later.');
          default:
            throw new Error(`Amadeus API error: ${status} - ${JSON.stringify(data)}`);
        }
      }

      // Generic error
      throw new Error(`Failed to search flights: ${error.message}`);
    }
  }
}
