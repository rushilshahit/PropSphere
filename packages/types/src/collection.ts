import type { PropertySummary } from './property';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  share_token: string | null;
  created_at: string;
}

export interface CollectionProperty {
  id: string;
  collection_id: string;
  property_id: string;
  notes: string | null;
  added_at: string;
}

export interface CollectionWithProperties extends Collection {
  properties: PropertySummary[];
}
