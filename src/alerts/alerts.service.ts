import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { NotFoundException } from '../common/exceptions/business.exception';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new price alert
   */
  async create(dto: CreateAlertDto) {
    // Validate that at least one notification method is provided
    if (!dto.email && !dto.webhook) {
      throw new Error('Either email or webhook must be provided for notifications');
    }

    const alert = await this.prisma.priceAlert.create({
      data: {
        origin: dto.origin,
        destination: dto.destination,
        departDate: new Date(dto.departDate),
        passengers: dto.passengers,
        targetPrice: dto.targetPrice,
        currency: dto.currency || 'USD',
        email: dto.email,
        webhook: dto.webhook,
      },
    });

    this.logger.log(
      `Created price alert ${alert.id} for ${alert.origin} -> ${alert.destination} at $${alert.targetPrice}`,
    );

    return alert;
  }

  /**
   * Get all alerts with optional filters
   */
  async findAll(status?: string) {
    const where = status ? { status: status as any } : {};

    return this.prisma.priceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { notifications: true },
        },
      },
    });
  }

  /**
   * Get a single alert by ID
   */
  async findOne(id: string) {
    const alert = await this.prisma.priceAlert.findUnique({
      where: { id },
      include: {
        notifications: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!alert) {
      throw new NotFoundException('Price alert', id);
    }

    return alert;
  }

  /**
   * Update an alert
   */
  async update(id: string, dto: UpdateAlertDto) {
    const alert = await this.findOne(id);

    const updated = await this.prisma.priceAlert.update({
      where: { id },
      data: {
        status: dto.status,
        targetPrice: dto.targetPrice,
        email: dto.email,
        webhook: dto.webhook,
      },
    });

    this.logger.log(`Updated price alert ${id}`);

    return updated;
  }

  /**
   * Delete an alert
   */
  async remove(id: string) {
    const alert = await this.findOne(id);

    await this.prisma.priceAlert.delete({
      where: { id },
    });

    this.logger.log(`Deleted price alert ${id}`);

    return { message: 'Alert deleted successfully' };
  }

  /**
   * Get active alerts that need to be checked
   */
  async getAlertsToCheck() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    return this.prisma.priceAlert.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { lastChecked: null },
          { lastChecked: { lte: oneHourAgo } },
        ],
        departDate: {
          gte: now, // Only check future flights
        },
      },
      orderBy: { lastChecked: 'asc' },
      take: 50, // Check 50 alerts at a time
    });
  }

  /**
   * Mark alert as checked
   */
  async markAsChecked(id: string) {
    await this.prisma.priceAlert.update({
      where: { id },
      data: { lastChecked: new Date() },
    });
  }

  /**
   * Create a notification record
   */
  async createNotification(alertId: string, currentPrice: number, message: string) {
    return this.prisma.priceAlertNotification.create({
      data: {
        alertId,
        currentPrice,
        message,
      },
    });
  }

  /**
   * Mark alert as triggered (price target met)
   */
  async markAsTriggered(id: string) {
    await this.prisma.priceAlert.update({
      where: { id },
      data: { status: 'TRIGGERED' },
    });
  }
}
