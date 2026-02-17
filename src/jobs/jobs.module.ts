import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PriceCheckProcessor } from './processors/price-check.processor';
import { PriceCheckScheduler } from './schedulers/price-check.scheduler';
import { AlertsModule } from '../alerts/alerts.module';
import { ProvidersModule } from '../providers/providers.module';
import { AmadeusModule } from '../providers/amadeus/amadeus.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: process.env.REDIS_URL || {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'price-check',
    }),
    AlertsModule,
    ProvidersModule,
    AmadeusModule,
    NotificationsModule,
  ],
  providers: [PriceCheckProcessor, PriceCheckScheduler],
  exports: [BullModule],
})
export class JobsModule {}
