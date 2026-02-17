// Amadeus API Response Types

export interface AmadeusAuthResponse {
  type: string;
  username: string;
  application_name: string;
  client_id: string;
  token_type: string;
  access_token: string;
  expires_in: number;
  state: string;
}

export interface AmadeusFlightOffersResponse {
  meta: {
    count: number;
    links?: {
      self: string;
    };
  };
  data: AmadeusFlightOffer[];
  dictionaries?: {
    locations?: Record<string, AmadeusLocation>;
    aircraft?: Record<string, string>;
    currencies?: Record<string, string>;
    carriers?: Record<string, string>;
  };
}

export interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate?: string;
  numberOfBookableSeats?: number;
  itineraries: AmadeusItinerary[];
  price: AmadeusPrice;
  pricingOptions?: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings?: AmadeusTravelerPricing[];
}

export interface AmadeusItinerary {
  duration: string; // ISO 8601 duration format, e.g., "PT5H20M"
  segments: AmadeusSegment[];
}

export interface AmadeusSegment {
  departure: AmadeusEndpoint;
  arrival: AmadeusEndpoint;
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  operating?: {
    carrierCode: string;
  };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface AmadeusEndpoint {
  iataCode: string;
  terminal?: string;
  at: string; // ISO 8601 datetime
}

export interface AmadeusPrice {
  currency: string;
  total: string;
  base: string;
  fees?: Array<{
    amount: string;
    type: string;
  }>;
  grandTotal: string;
}

export interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: {
    currency: string;
    total: string;
    base: string;
  };
  fareDetailsBySegment: Array<{
    segmentId: string;
    cabin: string;
    fareBasis: string;
    class: string;
    includedCheckedBags: {
      quantity: number;
    };
  }>;
}

// Airport & City Search Response Types

export interface AmadeusLocationResponse {
  meta: {
    count: number;
    links: {
      self: string;
    };
  };
  data: AmadeusLocation[];
}

export interface AmadeusLocation {
  type: string;
  subType: string; // "AIRPORT" | "CITY"
  name: string;
  detailedName: string;
  id: string;
  self: {
    href: string;
    methods: string[];
  };
  timeZoneOffset?: string;
  iataCode: string;
  geoCode?: {
    latitude: number;
    longitude: number;
  };
  address: {
    cityName: string;
    cityCode?: string;
    countryName: string;
    countryCode: string;
    stateCode?: string;
    regionCode?: string;
  };
  analytics?: {
    travelers: {
      score: number;
    };
  };
}
