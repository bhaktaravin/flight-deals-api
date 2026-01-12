import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { FlightProvider } from '../provider.interface';
import { SearchFlightsDto } from '../../search/dto/search-flights.dto';
import { FlightOffer } from '../../search/models/flight-offer.model';

@Injectable()
export class MockFlightProvider implements FlightProvider {
  async search(_: SearchFlightsDto): Promise<FlightOffer[]> {
    return [
      {
        id: uuid(),
        provider: 'mock',
        price: 199,
        currency: 'USD',
        durationMinutes: 320,
        stops: 0,
        segments: [
          {
            from: 'LAX',
            to: 'JFK',
            departAt: '2026-02-01T08:00:00Z',
            arriveAt: '2026-02-01T13:20:00Z',
            carrier: 'MO',
            flightNumber: 'MO123',
          },
        ],
      },
      {
        id: uuid(),
        provider: 'mock',
        price: 149,
        currency: 'USD',
        durationMinutes: 450,
        stops: 1,
        segments: [
          {
            from: 'LAX',
            to: 'DEN',
            departAt: '2026-02-01T07:30:00Z',
            arriveAt: '2026-02-01T10:30:00Z',
            carrier: 'MO',
            flightNumber: 'MO88',
          },
          {
            from: 'DEN',
            to: 'JFK',
            departAt: '2026-02-01T11:30:00Z',
            arriveAt: '2026-02-01T15:00:00Z',
            carrier: 'MO',
            flightNumber: 'MO90',
          },
        ],
      },
    ];
  }
}
