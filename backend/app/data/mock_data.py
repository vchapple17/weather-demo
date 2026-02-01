import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import numpy as np
from ..models.booking_type import BookingType
from ..models.reservation import Location, Reservation, HourlyUtilization
from ..config import settings


# 7 Golf facility locations across different US regions
LOCATIONS: List[Location] = [
    Location(
        id="loc_001",
        name="Sunset Valley Golf Club",
        latitude=33.7490,
        longitude=-84.3880,
        city="Atlanta",
        state="GA",
        available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT]
    ),
    Location(
        id="loc_002",
        name="Pinehurst Family Golf",
        latitude=35.1954,
        longitude=-79.4695,
        city="Pinehurst",
        state="NC",
        available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE, BookingType.INDOOR_DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT, BookingType.INDOOR_PUTT_PUTT]
    ),
    Location(
        id="loc_003",
        name="Desert Springs Golf Resort",
        latitude=33.8303,
        longitude=-116.5453,
        city="Palm Springs",
        state="CA",
        available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE]
    ),
    Location(
        id="loc_004",
        name="Lakeside Country Club",
        latitude=41.8781,
        longitude=-87.6298,
        city="Chicago",
        state="IL",
        available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE, BookingType.INDOOR_DRIVING_RANGE]
    ),
    Location(
        id="loc_005",
        name="Ocean Breeze Golf Links",
        latitude=26.1224,
        longitude=-80.1373,
        city="Fort Lauderdale",
        state="FL",
        available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT]
    ),
    Location(
        id="loc_006",
        name="Mountain View Golf Academy",
        latitude=39.7392,
        longitude=-104.9903,
        city="Denver",
        state="CO",
        available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE, BookingType.INDOOR_DRIVING_RANGE, BookingType.INDOOR_PUTT_PUTT]
    ),
    Location(
        id="loc_007",
        name="Texas Star Golf Course",
        latitude=32.7767,
        longitude=-96.7970,
        city="Dallas",
        state="TX",
        available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT, BookingType.INDOOR_PUTT_PUTT]
    ),
]


class MockDataGenerator:
    def __init__(self, seed: int = 42):
        random.seed(seed)
        np.random.seed(seed)
        self._reservations_cache: Dict[str, List[Reservation]] = {}
        self._utilization_cache: Dict[str, List[HourlyUtilization]] = {}

    def get_locations(self) -> List[Location]:
        return LOCATIONS

    def get_location(self, location_id: str) -> Location:
        for loc in LOCATIONS:
            if loc.id == location_id:
                return loc
        raise ValueError(f"Location {location_id} not found")

    def _get_base_utilization_pattern(self, hour: int, day_of_week: int, booking_type: BookingType) -> float:
        """Get base utilization rate based on time patterns."""
        # Weekend boost
        weekend_multiplier = 1.3 if day_of_week >= 5 else 1.0

        # Hour patterns differ by booking type
        if booking_type in (BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE):
            # Golf rounds peak morning and late afternoon
            if 6 <= hour < 8:
                base = 0.5  # Early birds
            elif 8 <= hour < 11:
                base = 0.85  # Peak morning
            elif 11 <= hour < 14:
                base = 0.6  # Midday slowdown
            elif 14 <= hour < 17:
                base = 0.75  # Afternoon pickup
            elif 17 <= hour < 19:
                base = 0.4  # Evening wind-down
            else:
                base = 0.1  # Off hours
        elif booking_type == BookingType.DRIVING_RANGE:
            # Range has broader usage
            if 6 <= hour < 9:
                base = 0.4
            elif 9 <= hour < 12:
                base = 0.7
            elif 12 <= hour < 17:
                base = 0.65
            elif 17 <= hour < 20:
                base = 0.8  # After work peak
            else:
                base = 0.15
        elif booking_type == BookingType.INDOOR_DRIVING_RANGE:
            # Indoor range - evening heavy
            if 6 <= hour < 9:
                base = 0.3
            elif 9 <= hour < 12:
                base = 0.5
            elif 12 <= hour < 17:
                base = 0.55
            elif 17 <= hour < 21:
                base = 0.85  # After work peak
            else:
                base = 0.2
        elif booking_type in (BookingType.OUTDOOR_PUTT_PUTT, BookingType.INDOOR_PUTT_PUTT):
            # Putt-putt - family oriented, afternoon/evening
            if 10 <= hour < 14:
                base = 0.5
            elif 14 <= hour < 18:
                base = 0.75  # Family time
            elif 18 <= hour < 21:
                base = 0.7
            else:
                base = 0.15
        else:
            base = 0.5

        return min(1.0, base * weekend_multiplier)

    def _apply_weather_impact(
        self,
        base_utilization: float,
        booking_type: BookingType,
        temperature: float,
        wind_speed: float,
        precipitation: float
    ) -> float:
        """Apply weather impact to utilization (outdoor only)."""
        if booking_type.is_indoor:
            # Indoor facilities not affected by weather
            # Actually, bad weather might increase indoor usage
            if precipitation > 0.1 or wind_speed > 15:
                return min(1.0, base_utilization * 1.2)
            return base_utilization

        # Outdoor facilities
        utilization = base_utilization

        # Rain impact - severe
        if precipitation > 0.5:
            utilization *= 0.1  # Almost no one plays
        elif precipitation > 0.2:
            utilization *= 0.3
        elif precipitation > 0.05:
            utilization *= 0.6

        # Wind impact - golf specific "Wind Wall"
        if booking_type in (BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE):
            if wind_speed > 25:
                utilization *= 0.15  # Severe wind wall
            elif wind_speed > 20:
                utilization *= 0.35
            elif wind_speed > 15:
                utilization *= 0.6
            elif wind_speed > 12:
                utilization *= 0.8
        elif booking_type == BookingType.DRIVING_RANGE:
            if wind_speed > 20:
                utilization *= 0.4
            elif wind_speed > 15:
                utilization *= 0.7

        # Temperature impact
        if temperature < 45:
            utilization *= 0.3
        elif temperature < 55:
            utilization *= 0.6
        elif temperature > 100:
            utilization *= 0.4
        elif temperature > 95:
            utilization *= 0.6
        elif temperature > 90:
            utilization *= 0.8

        return max(0.0, min(1.0, utilization))

    def generate_mock_weather(self, location: Location, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Generate mock weather data for a location."""
        weather_data = []
        current = start_date

        # Base temperatures by region (summer baseline)
        region_temps = {
            "GA": 85, "NC": 82, "CA": 75, "IL": 78, "FL": 88,
            "CO": 75, "TX": 92, "MA": 75, "WA": 68, "NV": 95, "AZ": 100
        }
        base_temp = region_temps.get(location.state, 75)

        while current < end_date:
            # Seasonal adjustment
            month = current.month
            if month in (12, 1, 2):
                seasonal_adj = -25
            elif month in (3, 4, 5):
                seasonal_adj = -10
            elif month in (6, 7, 8):
                seasonal_adj = 0
            else:
                seasonal_adj = -15

            # Daily variation
            hour = current.hour
            if 6 <= hour < 12:
                daily_adj = -5 + (hour - 6)
            elif 12 <= hour < 18:
                daily_adj = 5
            else:
                daily_adj = -3

            temp = base_temp + seasonal_adj + daily_adj + random.gauss(0, 5)

            # Wind patterns
            wind_base = 8 if location.state in ("CA", "WA", "CO") else 5
            wind = max(0, wind_base + random.gauss(0, 5) + (3 if 12 <= hour < 18 else 0))

            # Precipitation (random events)
            precip = 0.0
            if random.random() < 0.15:  # 15% chance of rain
                precip = random.expovariate(2)  # Exponential distribution

            weather_data.append({
                "timestamp": current,
                "temperature_f": round(temp, 1),
                "wind_speed_mph": round(wind, 1),
                "precipitation_inches": round(precip, 2),
                "weather_code": 61 if precip > 0.1 else 0
            })

            current += timedelta(hours=1)

        return weather_data

    def generate_utilization_data(
        self,
        location: Location,
        start_date: datetime,
        end_date: datetime,
        weather_data: List[Dict] = None
    ) -> List[HourlyUtilization]:
        """Generate hourly utilization data for a location."""
        cache_key = f"{location.id}_{start_date}_{end_date}"
        if cache_key in self._utilization_cache:
            return self._utilization_cache[cache_key]

        # Generate weather if not provided
        if weather_data is None:
            weather_data = self.generate_mock_weather(location, start_date, end_date)

        # Index weather by timestamp
        weather_by_hour = {w["timestamp"]: w for w in weather_data}

        utilization_records = []
        current = start_date

        while current < end_date:
            weather = weather_by_hour.get(current, {
                "temperature_f": 70,
                "wind_speed_mph": 5,
                "precipitation_inches": 0
            })

            for booking_type in location.available_booking_types:
                # Skip night hours for outdoor activities
                if booking_type.is_outdoor and (current.hour < 6 or current.hour > 20):
                    continue

                # Get base utilization
                base_util = self._get_base_utilization_pattern(
                    current.hour,
                    current.weekday(),
                    booking_type
                )

                # Apply weather impact
                final_util = self._apply_weather_impact(
                    base_util,
                    booking_type,
                    weather["temperature_f"],
                    weather["wind_speed_mph"],
                    weather["precipitation_inches"]
                )

                # Add some random noise
                final_util = max(0, min(1.0, final_util + random.gauss(0, 0.05)))

                capacity = settings.CAPACITY_PER_HOUR.get(booking_type.value, 10)
                bookings = int(final_util * capacity)
                revenue = bookings * settings.PRICING.get(booking_type.value, 20)

                utilization_records.append(HourlyUtilization(
                    location_id=location.id,
                    booking_type=booking_type,
                    date=current,
                    hour=current.hour,
                    bookings_count=bookings,
                    capacity=capacity,
                    utilization_rate=round(final_util, 3),
                    revenue=round(revenue, 2)
                ))

            current += timedelta(hours=1)

        self._utilization_cache[cache_key] = utilization_records
        return utilization_records

    def generate_reservations(
        self,
        location: Location,
        start_date: datetime,
        end_date: datetime
    ) -> List[Reservation]:
        """Generate individual reservation records."""
        cache_key = f"{location.id}_{start_date}_{end_date}"
        if cache_key in self._reservations_cache:
            return self._reservations_cache[cache_key]

        utilization_data = self.generate_utilization_data(location, start_date, end_date)
        reservations = []
        res_counter = 0

        for util in utilization_data:
            for _ in range(util.bookings_count):
                res_counter += 1
                party_size = random.choices([1, 2, 3, 4], weights=[0.15, 0.35, 0.25, 0.25])[0]

                # Duration by booking type
                durations = {
                    BookingType.NINE_HOLE: 120,
                    BookingType.EIGHTEEN_HOLE: 240,
                    BookingType.DRIVING_RANGE: 60,
                    BookingType.INDOOR_DRIVING_RANGE: 60,
                    BookingType.OUTDOOR_PUTT_PUTT: 45,
                    BookingType.INDOOR_PUTT_PUTT: 45,
                }

                price = settings.PRICING.get(util.booking_type.value, 20) * party_size
                # Add some price variation
                price = round(price * random.uniform(0.9, 1.1), 2)

                reservations.append(Reservation(
                    id=f"res_{location.id}_{res_counter:06d}",
                    location_id=location.id,
                    booking_type=util.booking_type,
                    timestamp=util.date.replace(minute=random.randint(0, 59)),
                    party_size=party_size,
                    price=price,
                    duration_minutes=durations.get(util.booking_type, 60)
                ))

        self._reservations_cache[cache_key] = reservations
        return reservations


# Singleton instance
mock_generator = MockDataGenerator()
