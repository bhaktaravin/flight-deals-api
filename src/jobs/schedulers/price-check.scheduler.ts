import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AlertsService } from '../../alerts/alerts.service';

@Injectable()
export class PriceCheckScheduler {
  private readonly logger = new Logger(PriceCheckScheduler.name);

  constructor(
    @InjectQueue('price-check') private priceCheckQueue: Queue,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * Check prices every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handlePriceChecks() {
    this.logger.log('Starting scheduled price checks...');

    try {
      // Get alerts that need checking
      const alerts = await this.alertsService.getAlertsToCheck();

      if (alerts.length === 0) {
        this.logger.log('No alerts to check');
        return;
      }

      this.logger.log(`Queueing ${alerts.length} price alerts for checking`);

      // Add each alert to the queue
      for (const alert of alerts) {
        await this.priceCheckQueue.add('check-alert', alert, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        });
      }

      this.logger.log(`Successfully queued ${alerts.length} price checks`);
    } catch (error) {
      this.logger.error('Failed to queue price checks:', error);
    }
  }

  /**
   * Manual trigger for testing (can be called from endpoint)
   */
  async triggerPriceCheck(alertId: string) {
    const alert = await this.alertsService.findOne(alertId);

    await this.priceCheckQueue.add('check-alert', alert, {
      attempts: 1,
    });

    this.logger.log(`Manually triggered price check for alert ${alertId}`);
  }
}
