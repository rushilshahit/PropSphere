import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MapsService {
  constructor(private readonly config: ConfigService) {}

  async checkStreetView(lat: number, lng: number): Promise<{ available: boolean }> {
    const key = this.config.get<string>('googleMaps.serverKey');
    const url =
      `https://maps.googleapis.com/maps/api/streetview/metadata` +
      `?location=${lat},${lng}&key=${key}`;
    const res = await fetch(url);
    const data = (await res.json()) as { status: string };
    return { available: data.status === 'OK' };
  }
}
