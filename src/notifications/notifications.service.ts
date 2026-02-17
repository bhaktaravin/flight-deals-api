import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface PriceAlertNotification {
  origin: string;
  destination: string;
  departDate: string;
  currentPrice: number;
  targetPrice: number;
  currency: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly httpService: HttpService) {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (emailHost && emailPort && emailUser && emailPassword) {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(emailPort),
        secure: emailPort === '465',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      } as any);
      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn(
        'Email credentials not configured. Email notifications disabled. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD in .env',
      );
    }
  }

  /**
   * Send price alert email
   */
  async sendPriceAlertEmail(to: string, notification: PriceAlertNotification): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping email.');
      return false;
    }

    const { origin, destination, departDate, currentPrice, targetPrice, currency } = notification;

    const subject = `✈️ Price Alert: ${origin} → ${destination} - ${currency}${currentPrice}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎉 Price Drop Alert!</h2>
        <p>Great news! The price for your flight has dropped below your target.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Flight Details</h3>
          <p><strong>Route:</strong> ${origin} → ${destination}</p>
          <p><strong>Departure:</strong> ${new Date(departDate).toLocaleDateString()}</p>
          <p style="font-size: 24px; color: #10b981; margin: 10px 0;">
            <strong>Current Price: ${currency}${currentPrice.toFixed(2)}</strong>
          </p>
          <p style="color: #6b7280;">Your target: ${currency}${targetPrice.toFixed(2)}</p>
        </div>

        <p>Book now to secure this price!</p>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          This is an automated alert from Flight Deals API.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Flight Deals API" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Price alert email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(url: string, notification: PriceAlertNotification): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.post(url, {
          type: 'price_alert',
          timestamp: new Date().toISOString(),
          data: notification,
        }),
      );

      this.logger.log(`Webhook sent to ${url}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send webhook to ${url}:`, error);
      return false;
    }
  }

  /**
   * Send notification via configured methods
   */
  async sendPriceAlert(
    email: string | null,
    webhook: string | null,
    notification: PriceAlertNotification,
  ): Promise<{ email: boolean; webhook: boolean }> {
    const results = {
      email: false,
      webhook: false,
    };

    if (email) {
      results.email = await this.sendPriceAlertEmail(email, notification);
    }

    if (webhook) {
      results.webhook = await this.sendWebhook(webhook, notification);
    }

    return results;
  }
}
