export interface FlightSegment {
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  carrier: string;
  flightNumber: string;
}

export interface FlightOffer {
  id: string;
  provider: string;
  price: number;
  currency: string;
  durationMinutes: number;
  stops: number;
  segments: FlightSegment[];
}
