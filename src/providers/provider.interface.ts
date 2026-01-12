import { SearchFlightsDto } from '../search/dto/search-flights.dto';
import { FlightOffer } from '../search/models/flight-offer.model';

export interface FlightProvider {
  search(dto: SearchFlightsDto): Promise<FlightOffer[]>;
}
