/**
 * Forecast mock data generator.
 *
 * Produces 7 days of weather + predicted booking utilization starting from today.
 * Uses a date-seeded RNG so the same day always renders the same values.
 * Mirrors the backend utilization pattern and weather-impact algorithms.
 */

// ---------------------------------------------------------------------------
// Seeded RNG (LCG) — deterministic per date, no external deps
// ---------------------------------------------------------------------------
function rng(seed: number) {
  let s = Math.abs(seed) % 2147483647 || 1;
  return {
    next(): number {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    },
    gauss(mean = 0, std = 1): number {
      // Box-Muller
      const u = 1 - this.next();
      const v = this.next();
      return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    choice<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)];
    },
  };
}

function dateSeed(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WeatherCondition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'windy' | 'hot' | 'cold';

export interface ForecastWeather {
  condition: WeatherCondition;
  conditionLabel: string;
  emoji: string;
  tempF: number;
  feelsLikeF: number;
  windMph: number;
  precipInches: number;
  humidity: number;
  uvIndex: number;
  cardColor: string;
}

export type PromoUrgency = 'high' | 'medium';

export interface ForecastSlot {
  hour: number;
  timeLabel: string;
  bookingType: string;
  bookingTypeLabel: string;
  isOutdoor: boolean;
  predictedUtilization: number; // 0–100
  capacity: number;
  estimatedBookings: number;
  promoRecommended: boolean;
  promoUrgency: PromoUrgency | null;
  promoReason: string | null;
  suggestedDiscount: string | null;
  estimatedRevenueLoss: number;
}

export interface ForecastDay {
  date: Date;
  dayLabel: string;   // "Today", "Mon", "Tue" …
  dateLabel: string;  // "Mar 28"
  weather: ForecastWeather;
  slots: ForecastSlot[];
  promoSlots: ForecastSlot[];
}

// ---------------------------------------------------------------------------
// Booking types for the default location (loc_001 — Sunset Valley)
// ---------------------------------------------------------------------------

const BOOKING_TYPES = [
  { type: 'EIGHTEEN_HOLE', label: '18-Hole Round', basePrice: 65, capacity: 8, isOutdoor: true },
  { type: 'NINE_HOLE',     label: '9-Hole Round',  basePrice: 35, capacity: 8, isOutdoor: true },
  { type: 'DRIVING_RANGE', label: 'Driving Range',  basePrice: 15, capacity: 20, isOutdoor: true },
] as const;

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function hourLabel(h: number): string {
  if (h === 0 || h === 12) return h === 0 ? '12:00 AM' : '12:00 PM';
  return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
}

// ---------------------------------------------------------------------------
// Weather generation
// ---------------------------------------------------------------------------

const MONTH_BASE_TEMP: Record<number, number> = {
  1: 48, 2: 52, 3: 62, 4: 70, 5: 78, 6: 86,
  7: 90, 8: 88, 9: 80, 10: 70, 11: 58, 12: 50,
};

function generateWeather(d: Date): ForecastWeather {
  const r = rng(dateSeed(d));
  const base = MONTH_BASE_TEMP[d.getMonth() + 1] ?? 70;
  const tempF = Math.round(base + r.gauss(0, 8));
  const windMph = Math.max(0, Math.round(r.gauss(10, 6)));
  const isRainy = r.next() < 0.22;
  const precipInches = isRainy ? parseFloat((r.next() * 0.6 + 0.05).toFixed(2)) : 0;
  const humidity = Math.round(isRainy ? r.gauss(80, 8) : r.gauss(50, 12));
  const feelsLikeF = Math.round(tempF - (windMph > 15 ? (windMph - 15) * 0.5 : 0) + (humidity > 70 ? 3 : 0));
  const uvIndex = isRainy ? Math.round(r.next() * 2) : Math.round(r.next() * 8 + 2);

  let condition: WeatherCondition;
  let emoji: string;
  let conditionLabel: string;
  let cardColor: string;

  if (precipInches > 0.15) {
    condition = 'rainy';      emoji = '🌧️'; conditionLabel = 'Rainy';           cardColor = '#2C3E50';
  } else if (precipInches > 0) {
    condition = 'cloudy';     emoji = '🌦️'; conditionLabel = 'Light Showers';   cardColor = '#5D6D7E';
  } else if (windMph > 22) {
    condition = 'windy';      emoji = '💨'; conditionLabel = 'Very Windy';       cardColor = '#616A6B';
  } else if (tempF > 92) {
    condition = 'hot';        emoji = '🌡️'; conditionLabel = 'Hot & Humid';      cardColor = '#922B21';
  } else if (tempF < 45) {
    condition = 'cold';       emoji = '🥶'; conditionLabel = 'Cold';             cardColor = '#1A5276';
  } else if (r.next() < 0.4) {
    condition = 'partly-cloudy'; emoji = '⛅'; conditionLabel = 'Partly Cloudy'; cardColor = '#2471A3';
  } else {
    condition = 'sunny';      emoji = '☀️'; conditionLabel = 'Sunny';            cardColor = '#1A6CA8';
  }

  return { condition, conditionLabel, emoji, tempF, feelsLikeF, windMph, precipInches, humidity, uvIndex, cardColor };
}

// ---------------------------------------------------------------------------
// Utilization pattern (mirrors backend MockDataGenerator)
// ---------------------------------------------------------------------------

function baseUtilization(hour: number, dow: number, bookingType: string): number {
  const weekend = dow >= 6 ? 1.3 : dow === 5 ? 1.15 : 1.0;

  let base: number;
  if (bookingType === 'EIGHTEEN_HOLE' || bookingType === 'NINE_HOLE') {
    if (hour < 7)       base = 0.15;
    else if (hour < 9)  base = 0.55;
    else if (hour < 12) base = 0.85;
    else if (hour < 14) base = 0.60;
    else if (hour < 17) base = 0.75;
    else if (hour < 19) base = 0.40;
    else                base = 0.10;
  } else { // DRIVING_RANGE
    if (hour < 8)       base = 0.35;
    else if (hour < 12) base = 0.70;
    else if (hour < 17) base = 0.65;
    else if (hour < 20) base = 0.80;
    else                base = 0.15;
  }
  return Math.min(1.0, base * weekend);
}

function applyWeatherImpact(util: number, bookingType: string, weather: ForecastWeather): number {
  // Outdoor only
  let u = util;
  const { precipInches, windMph, tempF } = weather;

  if (precipInches > 0.5)      u *= 0.10;
  else if (precipInches > 0.2) u *= 0.30;
  else if (precipInches > 0.05) u *= 0.60;

  if (bookingType === 'EIGHTEEN_HOLE' || bookingType === 'NINE_HOLE') {
    if (windMph > 25)      u *= 0.15;
    else if (windMph > 20) u *= 0.35;
    else if (windMph > 15) u *= 0.60;
    else if (windMph > 12) u *= 0.80;
  } else if (bookingType === 'DRIVING_RANGE') {
    if (windMph > 20)      u *= 0.40;
    else if (windMph > 15) u *= 0.70;
  }

  if (tempF < 45)       u *= 0.30;
  else if (tempF < 55)  u *= 0.60;
  else if (tempF > 100) u *= 0.40;
  else if (tempF > 95)  u *= 0.60;
  else if (tempF > 90)  u *= 0.80;

  return Math.max(0, Math.min(1, u));
}

// ---------------------------------------------------------------------------
// Promo recommendation logic
// ---------------------------------------------------------------------------

function promoReason(
  util: number,
  bookingType: string,
  weather: ForecastWeather,
  hour: number,
  dow: number,
): { reason: string; urgency: PromoUrgency; discount: string } | null {
  if (util > 55) return null;

  const { precipInches, windMph, tempF, condition } = weather;
  const reasons: string[] = [];

  // Weather-driven reasons
  if (precipInches > 0.15) reasons.push(`Rain (${precipInches}" expected)`);
  else if (precipInches > 0) reasons.push('Light showers forecast');
  if (windMph > 25) reasons.push(`Wind wall (${windMph} mph)`);
  else if (windMph > 18) reasons.push(`Strong winds (${windMph} mph)`);
  if (tempF < 48) reasons.push(`Cold morning (${tempF}°F)`);
  else if (tempF > 94) reasons.push(`Extreme heat (${tempF}°F)`);

  // Behavioral reasons (no weather excuse)
  if (reasons.length === 0) {
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow];
    if (hour < 8)       reasons.push(`Early slot — historically slow`);
    else if (hour >= 17) reasons.push(`Late afternoon lull`);
    else if (hour >= 12 && hour <= 13) reasons.push('Post-lunch slowdown');
    else reasons.push(`Slow ${dayName} pattern`);
  }

  const urgency: PromoUrgency = util < 35 ? 'high' : 'medium';
  const discount = urgency === 'high' ? '20–25% off' : '10–15% off';

  return { reason: reasons.join(' · '), urgency, discount };
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

function generateDay(date: Date, index: number): ForecastDay {
  const r = rng(dateSeed(date) + 999); // offset from weather seed
  const dow = date.getDay(); // 0=Sun…6=Sat
  const weather = generateWeather(date);

  const slots: ForecastSlot[] = [];

  for (const bt of BOOKING_TYPES) {
    for (const hour of HOURS) {
      const base = baseUtilization(hour, dow, bt.type);
      const withWeather = applyWeatherImpact(base, bt.type, weather);
      const noisy = Math.max(0, Math.min(1, withWeather + r.gauss(0, 0.04)));
      const util = Math.round(noisy * 100);
      const bookings = Math.round(noisy * bt.capacity);
      const promo = promoReason(util, bt.type, weather, hour, dow);

      slots.push({
        hour,
        timeLabel: hourLabel(hour),
        bookingType: bt.type,
        bookingTypeLabel: bt.label,
        isOutdoor: bt.isOutdoor,
        predictedUtilization: util,
        capacity: bt.capacity,
        estimatedBookings: bookings,
        promoRecommended: promo !== null,
        promoUrgency: promo?.urgency ?? null,
        promoReason: promo?.reason ?? null,
        suggestedDiscount: promo?.discount ?? null,
        estimatedRevenueLoss: Math.round((bt.capacity - bookings) * bt.basePrice),
      });
    }
  }

  // Promo slots sorted by urgency then revenue loss
  const promoSlots = slots
    .filter(s => s.promoRecommended)
    .sort((a, b) => {
      if (a.promoUrgency !== b.promoUrgency)
        return a.promoUrgency === 'high' ? -1 : 1;
      return b.estimatedRevenueLoss - a.estimatedRevenueLoss;
    });

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return {
    date,
    dayLabel: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : DAY_NAMES[dow],
    dateLabel: `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`,
    weather,
    slots,
    promoSlots,
  };
}

export function generateForecast(): ForecastDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return generateDay(d, i);
  });
}
