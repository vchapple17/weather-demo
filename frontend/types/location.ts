export type BookingType =
  | 'nine_hole'
  | 'eighteen_hole'
  | 'driving_range_outdoor'
  | 'driving_range_indoor'
  | 'putt_putt_outdoor'
  | 'putt_putt_indoor';

export const INDOOR_BOOKING_TYPES: BookingType[] = [
  'driving_range_indoor',
  'putt_putt_indoor',
];

export function isIndoor(type: BookingType): boolean {
  return INDOOR_BOOKING_TYPES.includes(type);
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: GeoCoordinates;
  phoneNumber: string;
  /** Booking types available at this facility */
  availableBookingTypes: BookingType[];
  /** Max tee times / bays / stations per hour, keyed by booking type */
  capacityPerHour: Partial<Record<BookingType, number>>;
  amenities: Amenity[];
  timezone: string;
}

export type Amenity =
  | 'pro_shop'
  | 'restaurant'
  | 'bar'
  | 'locker_room'
  | 'club_rental'
  | 'lessons'
  | 'event_space'
  | 'parking';
