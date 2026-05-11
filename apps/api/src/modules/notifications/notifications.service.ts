import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { SupabaseService } from '../../database/supabase.service';

export interface NotificationPayload {
  type: 'new_listing' | 'price_drop' | 'inspection' | 'system';
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface DbProfile {
  id: string;
  fcm_token: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseInitialized = false;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    const serviceAccountJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set — FCM push disabled');
      return;
    }
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson) as admin.ServiceAccount),
      });
    }
    this.firebaseInitialized = true;
  }

  async dispatch(userId: string, payload: NotificationPayload): Promise<void> {
    const { data: row, error } = await this.supabase.client
      .from('notifications')
      .insert({
        user_id: userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to insert notification', error);
      return;
    }

    if (this.firebaseInitialized) {
      await this.sendFcm(userId, payload);
    }

    void row;
  }

  private async sendFcm(userId: string, payload: NotificationPayload): Promise<void> {
    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('id, fcm_token')
      .eq('id', userId)
      .single();

    const token = (profile as DbProfile | null)?.fcm_token;
    if (!token) return;

    admin.messaging().send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
    }).catch((err: unknown) => {
      this.logger.warn('FCM send failed', err);
    });
  }

  async findAll(userId: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data ?? [];
  }

  async markRead(userId: string, id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async markAllRead(userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }
}
