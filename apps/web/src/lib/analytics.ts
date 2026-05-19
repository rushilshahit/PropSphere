import posthog from 'posthog-js';

export function initAnalytics(key: string, host: string) {
  posthog.init(key, { api_host: host, person_profiles: 'identified_only' });
}

export function captureOfferSubmitted(propertyId: string, amount: number, isAuthenticated: boolean) {
  posthog.capture('offer_submitted', { propertyId, amount, isAuthenticated });
}

export function captureVirtualTourViewed(propertyId: string) {
  posthog.capture('virtual_tour_viewed', { propertyId });
}

export function captureFloorPlanViewed(propertyId: string) {
  posthog.capture('floor_plan_viewed', { propertyId });
}

export function capturePriceHistoryViewed(propertyId: string, records: number) {
  posthog.capture('price_history_viewed', { propertyId, records });
}

export function captureAgentSignupStarted() {
  posthog.capture('agent_signup_started', {});
}

export function captureAgentSignupCompleted() {
  posthog.capture('agent_signup_completed', {});
}

export function captureAppraisalRequested(suburb: string) {
  posthog.capture('appraisal_requested', { suburb });
}

export function captureSoldSearchPerformed(filters: Record<string, unknown>) {
  posthog.capture('sold_search_performed', { filters });
}
