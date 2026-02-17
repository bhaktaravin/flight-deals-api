import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { AlertsService } from '../../alerts/alerts.service';
import { AmadeusProvider } from '../../providers/amadeus/amadeus.provider';
import { SearchFlightsDto } from '../../search/dto/search-flights.dto';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('price-check')
export class PriceCheckProcessor {
  private readonly logger = new Logger(PriceCheckProcessor.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly amadeusProvider: AmadeusProvider,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process('check-alert')
  async handlePriceCheck(job: Job) {
    const alert = job.data;

    this.logger.log(
      `Checking price alert ${alert.id}: ${alert.origin} -> ${alert.destination} on ${alert.departDate}`,
    );

    try {
      // Search for flights
      const searchDto: SearchFlightsDto = {
        origin: alert.origin,
        destination: alert.destination,
        departDate: new Date(alert.departDate).toISOString().split('T')[0],
        passengers: alert.passengers,
      };

      const flights = await this.amadeusProvider.search(searchDto);

      // Find lowest price
      if (flights.length === 0) {
        this.logger.warn(`No flights found for alert ${alert.id}`);
        await this.alertsService.markAsChecked(alert.id);
        return { found: false };
      }

      const lowestPrice = Math.min(...flights.map((f) => f.price));

      // Mark as checked
      await this.alertsService.markAsChecked(alert.id);

      // Check if price is below target
      if (lowestPrice <= alert.targetPrice) {
        this.logger.log(
          `🎯 Price alert triggered! ${alert.id}: $${lowestPrice} <= $${alert.targetPrice}`,
        );

        // Create notification record
        await this.alertsService.createNotification(
          alert.id,
          lowestPrice,
          `Price dropped to $${lowestPrice.toFixed(2)}! Target was $${alert.targetPrice}`,
        );

        // Send notifications
        const notificationData = {
          origin: alert.origin,
          destination: alert.destination,
          departDate: alert.departDate,
          currentPrice: lowestPrice,
          targetPrice: alert.targetPrice,
          currency: alert.currency,
        };

        const notificationResults = await this.notificationsService.sendPriceAlert(
          alert.email,
          alert.webhook,
          notificationData,
        );

        this.logger.log(
          `Notifications sent for alert ${alert.id}: Email=${notificationResults.email}, Webhook=${notificationResults.webhook}`,
        );

        // Mark alert as triggered
        await this.alertsService.markAsTriggered(alert.id);

        return { triggered: true, price: lowestPrice, notifications: notificationResults };
      }

      this.logger.debug(
        `Alert ${alert.id}: Current price $${lowestPrice} > Target $${alert.targetPrice}`,
      );

      return { triggered: false, price: lowestPrice };
    } catch (error) {
      this.logger.error(`Failed to check alert ${alert.id}:`, error);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    this.logger.debug(`Completed job ${job.id} with result:`, result);
  }

  @OnQueueFailed()
  onError(job: Job, error: Error) {
    this.logger.error(`Failed job ${job.id}:`, error.message);
  }
}
