import type { BookingType } from './location';

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export interface Player {
  firstName: string;
  lastName: string;
  /** USGA handicap index, null if unknown/not provided */
  handicapIndex: number | null;
  /** Loyalty/membership ID if the player is a member */
  memberId: string | null;
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export type CartOption =
  | 'walking'          // no cart, player walks
  | 'pull_cart'        // manual pull/push cart
  | 'single_cart'      // one motorized cart (typically fits 2)
  | 'double_cart';     // two motorized carts (for 3-4 players)

export interface CartSelection {
  option: CartOption;
  /** Number of motorized carts rented (0 for walking/pull_cart) */
  motorizedCount: number;
  /** Fee charged per cart */
  feePerCart: number;
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export interface BookingPricing {
  /** Green fee, range fee, or activity fee per player */
  baseRatePerPlayer: number;
  cartSelection: CartSelection;
  /** Any applicable member discount (percentage, 0–1) */
  memberDiscountRate: number;
  /** Promotional/coupon discount in dollars */
  promoDiscountAmount: number;
  /** Applicable taxes (percentage, 0–1) */
  taxRate: number;
  /** Total after discounts and tax */
  totalCharged: number;
}

// ---------------------------------------------------------------------------
// Booking / Reservation
// ---------------------------------------------------------------------------

export type BookingStatus =
  | 'pending'      // booked but not yet confirmed (e.g. awaiting payment)
  | 'confirmed'    // payment received, tee time held
  | 'checked_in'   // party arrived and checked in at the pro shop
  | 'completed'    // round/activity finished
  | 'no_show'      // party never arrived
  | 'cancelled';   // cancelled by guest or facility

export type BookingSource =
  | 'online'       // booked via website or app
  | 'phone'        // booked by calling the pro shop
  | 'walk_in'      // booked in person at the facility
  | 'third_party'; // booked via a third-party (GolfNow, TeeOff, etc.)

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Booking {
  /** Internal UUID */
  id: string;
  /** Human-readable confirmation number shown to the guest, e.g. "GC-20240715-4821" */
  confirmationNumber: string;

  locationId: string;
  bookingType: BookingType;
  status: BookingStatus;
  source: BookingSource;

  /** ISO 8601 date of the tee time / activity, e.g. "2024-07-15" */
  scheduledDate: string;
  /** 24-hour time string, e.g. "08:30" */
  teeTime: string;
  /** Estimated duration in minutes */
  estimatedDurationMinutes: number;

  /** Number of players in the party */
  partySize: number;
  players: Player[];

  /** Primary contact for the booking */
  contact: ContactInfo;

  pricing: BookingPricing;

  /** ISO 8601 datetime when the booking was created */
  createdAt: string;
  /** ISO 8601 datetime of last status change */
  updatedAt: string;

  /** Free-text notes from the pro shop or guest */
  notes: string | null;

  /** Weather conditions at tee time (populated after the fact for completed bookings) */
  weatherAtTeeTime: WeatherSnapshot | null;
}

// ---------------------------------------------------------------------------
// Lightweight weather snapshot attached to a completed booking
// (full WeatherReading is in weather.ts; this avoids a circular import)
// ---------------------------------------------------------------------------

export interface WeatherSnapshot {
  temperatureF: number;
  windSpeedMph: number;
  precipitationInches: number;
  conditionSummary: string;
}
