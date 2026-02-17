import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { AirportService } from './airport.service';
import { ProvidersModule } from '../providers/providers.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AmadeusModule } from '../providers/amadeus/amadeus.module';
import { MockFlightProvider } from '../providers/mock/mock.provider';
import { AmadeusProvider } from '../providers/amadeus/amadeus.provider';

@Module({
  imports: [ProvidersModule, /* PrismaModule, */ HttpModule, RedisModule, AmadeusModule],
  controllers: [SearchController],
  providers: [
    {
      provide: 'FLIGHT_PROVIDER',
      useFactory: (mock: MockFlightProvider, amadeus: AmadeusProvider) => {
        const provider = process.env.FLIGHT_PROVIDER || 'mock';
        return provider === 'amadeus' ? amadeus : mock;
      },
      inject: [MockFlightProvider, AmadeusProvider],
    },
    SearchService,
    AirportService,
  ],
})
export class SearchModule {}
