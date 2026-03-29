"""
Mock data generation — computation layer only.

Locations and weather readings are now owned by the repository layer
(app/repositories/mock/). This module retains:
  - MockDataGenerator: base utilization patterns and weather-impact algorithms
    (used by AnalysisService and directly tested in the test suite)
  - Thin helpers for generating HourlyUtilization and Reservation objects,
    which are derived/computed rather than stored in the repository.

LOCATIONS is re-exported from the repository for any legacy import sites.
"""
import random
from datetime import datetime, timedelta
from typing import List, Dict

import numpy as np

from ..models.booking_type import BookingType
from ..models.reservation import Location, Reservation, HourlyUtilization
from ..models.weather import WeatherReading
from ..config import settings
from ..repositories.mock.locations import LOCATIONS  # single source of truth

__all__ = ["MockDataGenerator", "LOCATIONS", "mock_generator"]


class MockDataGenerator:
    def __init__(self, seed: int = 42):
        random.seed(seed)
        np.random.seed(seed)
        self._utilization_cache: Dict[str, List[HourlyUtilization]] = {}
        self._reservations_cache: Dict[str, List[Reservation]] = {}

    # ------------------------------------------------------------------
    # Base utilization patterns (time-of-day / day-of-week algorithms)
    # ------------------------------------------------------------------

    def _get_base_utilization_pattern(self, hour: int, day_of_week: int, booking_type: BookingType) -> float:
        weekend_multiplier = 1.3 if day_of_week >= 5 else 1.0

        if booking_type in (BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE):
            if 6 <= hour < 8:
                base = 0.5
            elif 8 <= hour < 11:
                base = 0.85
            elif 11 <= hour < 14:
                base = 0.6
            elif 14 <= hour < 17:
                base = 0.75
            elif 17 <= hour < 19:
                base = 0.4
            else:
                base = 0.1
        elif booking_type == BookingType.DRIVING_RANGE:
            if 6 <= hour < 9:
                base = 0.4
            elif 9 <= hour < 12:
                base = 0.7
            elif 12 <= hour < 17:
                base = 0.65
            elif 17 <= hour < 20:
                base = 0.8
            else:
                base = 0.15
        elif booking_type == BookingType.INDOOR_DRIVING_RANGE:
            if 6 <= hour < 9:
                base = 0.3
            elif 9 <= hour < 12:
                base = 0.5
            elif 12 <= hour < 17:
                base = 0.55
            elif 17 <= hour < 21:
                base = 0.85
            else:
                base = 0.2
        elif booking_type in (BookingType.OUTDOOR_PUTT_PUTT, BookingType.INDOOR_PUTT_PUTT):
            if 10 <= hour < 14:
                base = 0.5
            elif 14 <= hour < 18:
                base = 0.75
            elif 18 <= hour < 21:
                base = 0.7
            else:
                base = 0.15
        else:
            base = 0.5

        return min(1.0, base * weekend_multiplier)

    # ------------------------------------------------------------------
    # Weather-impact algorithm (tested directly in test suite)
    # ------------------------------------------------------------------

    def _apply_weather_impact(
        self,
        base_utilization: float,
        booking_type: BookingType,
        temperature: float,
        wind_speed: float,
        precipitation: float,
    ) -> float:
        if booking_type.is_indoor:
            if precipitation > 0.1 or wind_speed > 15:
                return min(1.0, base_utilization * 1.2)
            return base_utilization

        utilization = base_utilization

        if precipitation > 0.5:
            utilization *= 0.1
        elif precipitation > 0.2:
            utilization *= 0.3
        elif precipitation > 0.05:
            utilization *= 0.6

        if booking_type in (BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE):
            if wind_speed > 25:
                utilization *= 0.15
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

    # ------------------------------------------------------------------
    # Derived data generators (use WeatherReading from the weather repo)
    # ------------------------------------------------------------------

    def generate_utilization_data(
        self,
        location: Location,
        start_date: datetime,
        end_date: datetime,
        weather_readings: List[WeatherReading] = None,
    ) -> List[HourlyUtilization]:
        cache_key = f"{location.id}_{start_date}_{end_date}"
        if cache_key in self._utilization_cache:
            return self._utilization_cache[cache_key]

        # Fetch weather from repo if not supplied
        if weather_readings is None:
            from ..repositories import get_weather_repo
            weather_readings = get_weather_repo().list_by_range(location.id, start_date, end_date)

        weather_by_hour = {w.timestamp: w for w in weather_readings}

        records: List[HourlyUtilization] = []
        current = start_date

        while current < end_date:
            w = weather_by_hour.get(current)
            temp = w.temperature_f if w else 70.0
            wind = w.wind_speed_mph if w else 5.0
            precip = w.precipitation_inches if w else 0.0

            for booking_type in location.available_booking_types:
                if booking_type.is_outdoor and (current.hour < 6 or current.hour > 20):
                    continue

                base_util = self._get_base_utilization_pattern(current.hour, current.weekday(), booking_type)
                final_util = self._apply_weather_impact(base_util, booking_type, temp, wind, precip)
                final_util = max(0.0, min(1.0, final_util + random.gauss(0, 0.05)))

                capacity = settings.CAPACITY_PER_HOUR.get(booking_type.value, 10)
                bookings = int(final_util * capacity)

                records.append(HourlyUtilization(
                    location_id=location.id,
                    booking_type=booking_type,
                    date=current,
                    hour=current.hour,
                    bookings_count=bookings,
                    capacity=capacity,
                    utilization_rate=round(final_util, 3),
                    revenue=round(bookings * settings.PRICING.get(booking_type.value, 20), 2),
                ))

            current += timedelta(hours=1)

        self._utilization_cache[cache_key] = records
        return records

    def generate_reservations(
        self,
        location: Location,
        start_date: datetime,
        end_date: datetime,
    ) -> List[Reservation]:
        cache_key = f"{location.id}_{start_date}_{end_date}"
        if cache_key in self._reservations_cache:
            return self._reservations_cache[cache_key]

        utilization_data = self.generate_utilization_data(location, start_date, end_date)
        reservations: List[Reservation] = []
        res_counter = 0

        durations = {
            BookingType.NINE_HOLE: 120, BookingType.EIGHTEEN_HOLE: 240,
            BookingType.DRIVING_RANGE: 60, BookingType.INDOOR_DRIVING_RANGE: 60,
            BookingType.OUTDOOR_PUTT_PUTT: 45, BookingType.INDOOR_PUTT_PUTT: 45,
        }

        for util in utilization_data:
            for _ in range(util.bookings_count):
                res_counter += 1
                party_size = random.choices([1, 2, 3, 4], weights=[0.15, 0.35, 0.25, 0.25])[0]
                price = round(
                    settings.PRICING.get(util.booking_type.value, 20) * party_size * random.uniform(0.9, 1.1), 2
                )
                reservations.append(Reservation(
                    id=f"res_{location.id}_{res_counter:06d}",
                    location_id=location.id,
                    booking_type=util.booking_type,
                    timestamp=util.date.replace(minute=random.randint(0, 59)),
                    party_size=party_size,
                    price=price,
                    duration_minutes=durations.get(util.booking_type, 60),
                ))

        self._reservations_cache[cache_key] = reservations
        return reservations


# Singleton used by AnalysisService and tests
mock_generator = MockDataGenerator()
