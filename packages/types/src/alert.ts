import type { SearchFilters } from './search';

export type AlertFrequency = 'instant' | 'daily' | 'weekly';

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  alert_freq: AlertFrequency;
  alert_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'new_listing' | 'price_drop' | 'inspection' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  is_read: boolean;
  created_at: string;
}
