import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

export interface NewListingJobData {
  propertyId: string;
}

export interface PriceDropJobData {
  propertyId: string;
  newPrice: number;
}

@Injectable()
export class AlertsService {
  constructor(
    @InjectQueue('alerts') private readonly alertsQueue: Queue,
  ) {}

  async addNewListingJob(propertyId: string): Promise<void> {
    await this.alertsQueue.add('new-listing', { propertyId } satisfies NewListingJobData);
  }

  async addPriceDropJob(propertyId: string, newPrice: number): Promise<void> {
    await this.alertsQueue.add('price-drop', { propertyId, newPrice } satisfies PriceDropJobData);
  }
}
