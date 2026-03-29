from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from ...models.weather import (
    PrecipitationType, SkyCondition, WeatherReading, WindDirection,
)
from ..base import WeatherRepository

# Regional climate baselines — mirrors the region_temps logic from mock_data.py
# so both systems use consistent temperature expectations per location.
_LOCATION_CLIMATES: Dict[str, Dict] = {
    "loc_001": {"base_temp": 85, "temp_range": 20, "rain_chance": 0.15, "wind_base": 5},   # Atlanta, GA
    "loc_002": {"base_temp": 82, "temp_range": 22, "rain_chance": 0.15, "wind_base": 5},   # Pinehurst, NC
    "loc_003": {"base_temp": 75, "temp_range": 15, "rain_chance": 0.08, "wind_base": 8},   # Palm Springs, CA
    "loc_004": {"base_temp": 78, "temp_range": 28, "rain_chance": 0.15, "wind_base": 5},   # Chicago, IL
    "loc_005": {"base_temp": 88, "temp_range": 12, "rain_chance": 0.15, "wind_base": 5},   # Fort Lauderdale, FL
    "loc_006": {"base_temp": 75, "temp_range": 25, "rain_chance": 0.15, "wind_base": 8},   # Denver, CO
    "loc_007": {"base_temp": 92, "temp_range": 18, "rain_chance": 0.15, "wind_base": 5},   # Dallas, TX
}

_WIND_DIRECTIONS = list(WindDirection)


def _seasonal_adjustment(month: int) -> float:
    if month in (12, 1, 2):
        return -25.0
    elif month in (3, 4, 5):
        return -10.0
    elif month in (9, 10, 11):
        return -15.0
    return 0.0  # summer


def _hourly_adjustment(hour: int) -> float:
    if 6 <= hour < 12:
        return -5 + (hour - 6)
    elif 12 <= hour < 18:
        return 5.0
    return -3.0


def generate_reading(
    rng: random.Random,
    location_id: str,
    dt: datetime,
) -> WeatherReading:
    """Generate a single realistic hourly WeatherReading for a location and time."""
    climate = _LOCATION_CLIMATES.get(
        location_id, {"base_temp": 75, "temp_range": 20, "rain_chance": 0.15, "wind_base": 5}
    )

    temp = (
        climate["base_temp"]
        + _seasonal_adjustment(dt.month)
        + _hourly_adjustment(dt.hour)
        + rng.gauss(0, 5)
    )
    feels_like = temp - rng.uniform(0, 5)
    dew_point = temp - rng.uniform(10, 30)
    humidity = max(20.0, min(100.0, 100 - (temp - dew_point) * 2.5))

    wind_base = climate["wind_base"]
    afternoon_boost = 3.0 if 12 <= dt.hour < 18 else 0.0
    wind = max(0.0, wind_base + rng.gauss(0, 5) + afternoon_boost)
    gust = wind + rng.uniform(0, 10)
    wind_dir = rng.choice(_WIND_DIRECTIONS)
    wind_deg = _WIND_DIRECTIONS.index(wind_dir) * (360.0 / len(_WIND_DIRECTIONS))

    is_rainy = rng.random() < climate["rain_chance"]
    if is_rainy:
        precip = rng.expovariate(2)
        if precip > 0.5:
            precip_type = PrecipitationType.HEAVY_RAIN
        elif precip > 0.1:
            precip_type = PrecipitationType.RAIN
        else:
            precip_type = PrecipitationType.DRIZZLE
        sky = rng.choice([SkyCondition.OVERCAST, SkyCondition.MOSTLY_CLOUDY])
        cloud_cover = rng.uniform(70, 100)
        visibility = rng.uniform(2, 8)
    else:
        precip = 0.0
        precip_type = PrecipitationType.NONE
        sky = rng.choice([SkyCondition.CLEAR, SkyCondition.MOSTLY_CLEAR, SkyCondition.PARTLY_CLOUDY])
        cloud_cover = rng.uniform(0, 40)
        visibility = rng.uniform(8, 15)

    uv = max(0.0, min(11.0, (dt.hour - 6) * 1.2 - abs(dt.hour - 13) * 0.8)) if 6 <= dt.hour <= 20 else 0.0

    return WeatherReading(
        id=str(uuid.uuid4()),
        location_id=location_id,
        timestamp=dt,
        is_forecast=False,
        temperature_f=round(temp, 1),
        feels_like_f=round(feels_like, 1),
        dew_point_f=round(dew_point, 1),
        humidity_percent=round(humidity, 1),
        wind_speed_mph=round(wind, 1),
        wind_gust_mph=round(gust, 1),
        wind_direction=wind_dir,
        wind_direction_deg=round(wind_deg, 1),
        precipitation_inches=round(precip, 3),
        precipitation_type=precip_type,
        precipitation_probability_percent=round(climate["rain_chance"] * 100),
        sky_condition=sky,
        cloud_cover_percent=round(cloud_cover, 1),
        visibility_miles=round(visibility, 1),
        uv_index=round(uv, 1),
        solar_radiation_wm2=None,
        pressure_inhg=round(rng.uniform(29.6, 30.4), 2),
        weather_code=61 if precip > 0.1 else 0,
        playability_score=None,
        source="mock",
    )


class MockWeatherRepository(WeatherRepository):
    def __init__(self, seed: int = 42) -> None:
        self._rng = random.Random(seed)
        # Lazily cache readings keyed by (location_id, datetime)
        self._cache: Dict[tuple, WeatherReading] = {}

    def _get_or_generate(self, location_id: str, dt: datetime) -> WeatherReading:
        # Normalise to top of the hour
        dt = dt.replace(minute=0, second=0, microsecond=0)
        key = (location_id, dt)
        if key not in self._cache:
            self._cache[key] = generate_reading(self._rng, location_id, dt)
        return self._cache[key]

    def get_reading(self, reading_id: str) -> Optional[WeatherReading]:
        return next((r for r in self._cache.values() if r.id == reading_id), None)

    def get_for_hour(self, location_id: str, dt: datetime) -> Optional[WeatherReading]:
        return self._get_or_generate(location_id, dt)

    def list_by_range(self, location_id: str, start: datetime, end: datetime) -> List[WeatherReading]:
        readings = []
        current = start.replace(minute=0, second=0, microsecond=0)
        while current <= end:
            readings.append(self._get_or_generate(location_id, current))
            current += timedelta(hours=1)
        return readings

    def upsert(self, reading: WeatherReading) -> WeatherReading:
        key = (reading.location_id, reading.timestamp.replace(minute=0, second=0, microsecond=0))
        self._cache[key] = reading
        return reading
