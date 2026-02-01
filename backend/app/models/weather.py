from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


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
