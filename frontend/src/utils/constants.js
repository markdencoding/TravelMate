/**
 * TravelMate application-wide constants.
 */

export const APP_NAME = 'TravelMate';

export const EXPENSE_CATEGORIES = [
  { value: 'transportation', label: 'Transportation' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'food', label: 'Food' },
  { value: 'activities', label: 'Activities' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
];

export const USER_ROLES = {
  TRAVELER: 'traveler',
  ADMIN: 'admin',
};

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  REMINDER: 'reminder',
  WARNING: 'warning',
  TRIP: 'trip',
  BUDGET: 'budget',
};
