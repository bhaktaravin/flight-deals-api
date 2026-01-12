import { Module } from '@nestjs/common';
import { MockFlightProvider } from './mock/mock.provider';

@Module({
  providers: [MockFlightProvider],
  exports: [MockFlightProvider],
})
export class ProvidersModule {}
