from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


# ---------------------------------------------------------------------------
# Enums for the richer WeatherReading model
# ---------------------------------------------------------------------------

class PrecipitationType(str, Enum):
    NONE = "NONE"
    DRIZZLE = "DRIZZLE"
    RAIN = "RAIN"
    HEAVY_RAIN = "HEAVY_RAIN"
    SLEET = "SLEET"
    SNOW = "SNOW"
    HAIL = "HAIL"


class SkyCondition(str, Enum):
    CLEAR = "CLEAR"
    MOSTLY_CLEAR = "MOSTLY_CLEAR"
    PARTLY_CLOUDY = "PARTLY_CLOUDY"
    MOSTLY_CLOUDY = "MOSTLY_CLOUDY"
    OVERCAST = "OVERCAST"


class WindDirection(str, Enum):
    N = "N"; NNE = "NNE"; NE = "NE"; ENE = "ENE"
    E = "E"; ESE = "ESE"; SE = "SE"; SSE = "SSE"
    S = "S"; SSW = "SSW"; SW = "SW"; WSW = "WSW"
    W = "W"; WNW = "WNW"; NW = "NW"; NNW = "NNW"


# ---------------------------------------------------------------------------
# Rich WeatherReading — used by the repository layer
# Sits alongside the existing HourlyWeather (used by analysis services)
# ---------------------------------------------------------------------------

class WeatherReading(BaseModel):
    """Full observed or forecast weather record for one hour at one location."""
    id: str
    location_id: str
    # ISO 8601 datetime this reading applies to
    timestamp: datetime
    # True = forecast pulled ahead of time; False = actual observed
    is_forecast: bool = False

    # Temperature
    temperature_f: float
    feels_like_f: float
    dew_point_f: float
    humidity_percent: float = Field(ge=0.0, le=100.0)

    # Wind
    wind_speed_mph: float = Field(ge=0.0)
    wind_gust_mph: float = Field(ge=0.0)
    wind_direction: WindDirection
    wind_direction_deg: float = Field(ge=0.0, lt=360.0)

    # Precipitation
    precipitation_inches: float = Field(ge=0.0)
    precipitation_type: PrecipitationType
    precipitation_probability_percent: float = Field(default=0.0, ge=0.0, le=100.0)

    # Sky
    sky_condition: SkyCondition
    cloud_cover_percent: float = Field(ge=0.0, le=100.0)
    visibility_miles: float = Field(ge=0.0)

    # Solar
    uv_index: float = Field(ge=0.0)
    solar_radiation_wm2: Optional[float] = None

    # Pressure
    pressure_inhg: float

    # WMO code kept for backward compat with existing analysis services
    weather_code: Optional[int] = None

    # Composite playability score 0–100 (set by analysis engine, None until scored)
    playability_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)

    source: str = "open-meteo"

    @property
    def condition_description(self) -> str:
        if self.precipitation_inches > 0.1:
            return "Rainy"
        elif self.wind_speed_mph > 25:
            return "Very Windy"
        elif self.wind_speed_mph > 15:
            return "Windy"
        elif self.temperature_f < 50:
            return "Cold"
        elif self.temperature_f > 90:
            return "Hot"
        else:
            return "Fair"


class DailyWeatherSummary(BaseModel):
    """Aggregated daily summary derived from hourly WeatherReadings."""
    location_id: str
    date: str                       # ISO 8601 date, e.g. "2024-07-15"
    high_temp_f: float
    low_temp_f: float
    avg_wind_speed_mph: float
    max_wind_gust_mph: float
    total_precipitation_inches: float
    dominant_precip_type: PrecipitationType
    dominant_sky_condition: SkyCondition
    avg_humidity_percent: float
    max_uv_index: float
    good_playing_hours: int         # hours where playability_score >= 70
    poor_playing_hours: int         # hours where playability_score < 30
    sunrise: str                    # ISO 8601 datetime
    sunset: str                     # ISO 8601 datetime


class HourlyWeather(BaseModel):
    timestamp: datetime
    temperature_f: float  # Fahrenheit
    precipitation_inches: float
    wind_speed_mph: float
    weather_code: int  # WMO weather interpretation code

    @property
    def is_rainy(self) -> bool:
        # WMO codes 51-67: drizzle and rain, 80-82: rain showers
        return self.weather_code in range(51, 68) or self.weather_code in range(80, 83)

    @property
    def is_perfect_golf_weather(self) -> bool:
        from ..config import settings
        return (
            settings.PERFECT_TEMP_MIN <= self.temperature_f <= settings.PERFECT_TEMP_MAX
            and self.wind_speed_mph <= settings.PERFECT_WIND_MAX
            and self.precipitation_inches <= settings.PERFECT_PRECIP_MAX
        )

    @property
    def condition_description(self) -> str:
        if self.precipitation_inches > 0.1:
            return "Rainy"
        elif self.wind_speed_mph > 20:
            return "Very Windy"
        elif self.wind_speed_mph > 15:
            return "Windy"
        elif self.temperature_f < 50:
            return "Cold"
        elif self.temperature_f > 90:
            return "Hot"
        elif self.is_perfect_golf_weather:
            return "Perfect"
        else:
            return "Fair"


class WeatherData(BaseModel):
    location_id: str
    latitude: float
    longitude: float
    hourly_data: List[HourlyWeather]

    def get_weather_for_hour(self, dt: datetime) -> Optional[HourlyWeather]:
        for hw in self.hourly_data:
            if hw.timestamp.date() == dt.date() and hw.timestamp.hour == dt.hour:
                return hw
        return None


class WeatherCorrelation(BaseModel):
    booking_type: str
    weather_condition: str
    avg_utilization: float
    sample_count: int
    baseline_utilization: float
    utilization_impact: float  # Percentage change from baseline


class WindThreshold(BaseModel):
    booking_type: str
    wind_wall_mph: float  # The MPH at which utilization collapses
    utilization_above_threshold: float
    utilization_below_threshold: float
    confidence_score: float  # Based on sample size
