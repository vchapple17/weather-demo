from pydantic_settings import BaseSettings
from typing import Dict


class Settings(BaseSettings):
    # Open-Meteo API configuration
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1/archive"

    # Analysis thresholds
    DEAD_ZONE_UTILIZATION_THRESHOLD: float = 0.15  # 15%
    DEAD_ZONE_EXCLUDE_START_HOUR: int = 0  # 12 AM
    DEAD_ZONE_EXCLUDE_END_HOUR: int = 6    # 6 AM

    # Weather thresholds for "perfect" conditions
    PERFECT_TEMP_MIN: float = 60.0  # Fahrenheit
    PERFECT_TEMP_MAX: float = 75.0  # Fahrenheit
    PERFECT_WIND_MAX: float = 10.0  # MPH
    PERFECT_PRECIP_MAX: float = 0.0  # inches

    # Pricing per booking type (average revenue)
    PRICING: Dict[str, float] = {
        "NINE_HOLE": 35.0,
        "EIGHTEEN_HOLE": 65.0,
        "DRIVING_RANGE": 15.0,
        "INDOOR_DRIVING_RANGE": 25.0,
        "OUTDOOR_PUTT_PUTT": 12.0,
        "INDOOR_PUTT_PUTT": 15.0,
    }

    # Capacity per hour per booking type
    CAPACITY_PER_HOUR: Dict[str, int] = {
        "NINE_HOLE": 8,       # tee times
        "EIGHTEEN_HOLE": 8,   # tee times
        "DRIVING_RANGE": 20,  # bays
        "INDOOR_DRIVING_RANGE": 12,  # bays
        "OUTDOOR_PUTT_PUTT": 15,  # groups
        "INDOOR_PUTT_PUTT": 10,   # groups
    }

    class Config:
        env_prefix = "GOLF_"


settings = Settings()
