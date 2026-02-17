import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '../../redis/redis.service';
import { AmadeusAuthResponse } from './types/amadeus-response.types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AmadeusAuthService {
  private readonly logger = new Logger(AmadeusAuthService.name);
  private readonly CACHE_KEY = 'amadeus:token';
  private readonly TOKEN_TTL = 1500; // 25 minutes (5 min buffer before 30 min expiry)

  constructor(
    private readonly httpService: HttpService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get a valid OAuth token from cache or fetch a new one
   */
  async getToken(): Promise<string> {
    // Check Redis cache first
    const cachedToken = await this.redis.get(this.CACHE_KEY);

    if (cachedToken) {
      this.logger.debug('Using cached Amadeus token');
      return cachedToken;
    }

    // Fetch new token if not cached
    this.logger.log('Fetching new Amadeus OAuth token');
    return this.fetchNewToken();
  }

  /**
   * Fetch a new OAuth token from Amadeus and cache it
   */
  private async fetchNewToken(): Promise<string> {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    const baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';

    if (!clientId || !clientSecret) {
      throw new Error('Amadeus credentials not configured. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<AmadeusAuthResponse>(
          `${baseUrl}/v1/security/oauth2/token`,
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      const token = response.data.access_token;

      // Cache token with 25-minute TTL
      await this.redis.setex(this.CACHE_KEY, this.TOKEN_TTL, token);

      this.logger.log('Successfully fetched and cached Amadeus token');
      return token;
    } catch (error) {
      this.logger.error('Failed to fetch Amadeus token', error);

      if (error.response) {
        throw new Error(
          `Amadeus authentication failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      }

      throw new Error(`Amadeus authentication failed: ${error.message}`);
    }
  }

  /**
   * Clear the cached token (useful for testing or manual token refresh)
   */
  async clearToken(): Promise<void> {
    await this.redis.del(this.CACHE_KEY);
    this.logger.log('Cleared cached Amadeus token');
  }
}
