export const MAIN_ACCOUNT_ID = 'main';
export const DEFAULT_CURRENCY = 'EUR';

export const DOCUMENT_STAGE = {
  ISSUED: 'issued',
  PARTIAL: 'partial',
  SETTLED: 'settled',
  CANCELLED: 'cancelled',
};

export const DOCUMENT_STATUS = {
  ISSUED: 'issued',
  PARTIAL: 'partial',
  SETTLED: 'settled',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

export const MOVEMENT_STATUS = {
  POSTED: 'posted',
  VOID: 'void',
};

export const MOVEMENT_KIND = {
  COLLECTION: 'collection',
  PAYMENT: 'payment',
  ADJUSTMENT: 'adjustment',
  LEGACY_COLLECTION: 'legacy-collection',
  LEGACY_PAYMENT: 'legacy-payment',
};

export const TREASURY_LOOKAHEAD_DAYS = 14;
export const TREASURY_PROJECTION_WEEKS = 8;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;
