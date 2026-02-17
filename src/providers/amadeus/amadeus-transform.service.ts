import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  AmadeusFlightOffersResponse,
  AmadeusFlightOffer,
  AmadeusItinerary,
  AmadeusSegment,
} from './types/amadeus-response.types';
import { FlightOffer, FlightSegment } from '../../search/models/flight-offer.model';

@Injectable()
export class AmadeusTransformService {
  private readonly logger = new Logger(AmadeusTransformService.name);

  /**
   * Transform Amadeus API response to FlightOffer array
   */
  transform(amadeusResponse: AmadeusFlightOffersResponse): FlightOffer[] {
    if (!amadeusResponse.data || amadeusResponse.data.length === 0) {
      this.logger.debug('No flight offers found in Amadeus response');
      return [];
    }

    this.logger.debug(`Transforming ${amadeusResponse.data.length} Amadeus flight offers`);

    return amadeusResponse.data.map((offer) => this.transformOffer(offer));
  }

  /**
   * Transform a single Amadeus flight offer
   */
  private transformOffer(offer: AmadeusFlightOffer): FlightOffer {
    // Amadeus returns multiple itineraries for round trips (outbound + return)
    // For now, we'll use the first itinerary (outbound)
    const primaryItinerary = offer.itineraries[0];

    return {
      id: uuidv4(), // Generate unique ID
      provider: 'amadeus',
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      durationMinutes: this.parseDuration(primaryItinerary.duration),
      stops: this.calculateStops(primaryItinerary),
      segments: this.transformSegments(primaryItinerary.segments),
    };
  }

  /**
   * Parse ISO 8601 duration to minutes
   * Examples: "PT5H20M" -> 320, "PT1H" -> 60, "PT45M" -> 45
   */
  private parseDuration(iso8601Duration: string): number {
    const hoursMatch = iso8601Duration.match(/(\d+)H/);
    const minutesMatch = iso8601Duration.match(/(\d+)M/);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    return hours * 60 + minutes;
  }

  /**
   * Calculate number of stops (segments - 1)
   */
  private calculateStops(itinerary: AmadeusItinerary): number {
    return Math.max(0, itinerary.segments.length - 1);
  }

  /**
   * Transform Amadeus segments to FlightSegment array
   */
  private transformSegments(amadeusSegments: AmadeusSegment[]): FlightSegment[] {
    return amadeusSegments.map((segment) => ({
      from: segment.departure.iataCode,
      to: segment.arrival.iataCode,
      departAt: segment.departure.at,
      arriveAt: segment.arrival.at,
      carrier: segment.carrierCode,
      flightNumber: `${segment.carrierCode}${segment.number}`,
    }));
  }
}
