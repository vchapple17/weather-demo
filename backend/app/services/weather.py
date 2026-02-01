import httpx
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from ..models.weather import WeatherData, HourlyWeather
from ..models.reservation import Location
from ..config import settings


class WeatherService:
    def __init__(self):
        self._cache: Dict[str, WeatherData] = {}
        self._client = httpx.AsyncClient(timeout=30.0)

    def _cache_key(self, location_id: str, start_date: datetime, end_date: datetime) -> str:
        return f"{location_id}_{start_date.date()}_{end_date.date()}"

    async def fetch_weather(
        self,
        location: Location,
        start_date: datetime,
        end_date: datetime
    ) -> WeatherData:
        """Fetch weather data from Open-Meteo API."""
        cache_key = self._cache_key(location.id, start_date, end_date)
        if cache_key in self._cache:
            return self._cache[cache_key]

        # Determine if we need historical or forecast data
        today = datetime.now().date()

        if end_date.date() < today:
            # Historical data
            url = settings.OPEN_METEO_ARCHIVE_URL
        else:
            # Forecast/current data
            url = settings.OPEN_METEO_API_URL

        params = {
            "latitude": location.latitude,
            "longitude": location.longitude,
            "hourly": "temperature_2m,precipitation,wind_speed_10m,weather_code",
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "timezone": "America/New_York"
        }

        try:
            response = await self._client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            hourly_data = self._parse_response(data)
            weather_data = WeatherData(
                location_id=location.id,
                latitude=location.latitude,
                longitude=location.longitude,
                hourly_data=hourly_data
            )

            self._cache[cache_key] = weather_data
            return weather_data

        except (httpx.HTTPError, KeyError) as e:
            # Fall back to mock weather data
            return self._generate_mock_weather(location, start_date, end_date)

    def _parse_response(self, data: Dict) -> List[HourlyWeather]:
        """Parse Open-Meteo API response."""
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        precips = hourly.get("precipitation", [])
        winds = hourly.get("wind_speed_10m", [])
        codes = hourly.get("weather_code", [])

        result = []
        for i, time_str in enumerate(times):
            result.append(HourlyWeather(
                timestamp=datetime.fromisoformat(time_str),
                temperature_f=temps[i] if i < len(temps) else 70.0,
                precipitation_inches=precips[i] if i < len(precips) else 0.0,
                wind_speed_mph=winds[i] if i < len(winds) else 5.0,
                weather_code=codes[i] if i < len(codes) else 0
            ))

        return result

    def _generate_mock_weather(
        self,
        location: Location,
        start_date: datetime,
        end_date: datetime
    ) -> WeatherData:
        """Generate mock weather when API is unavailable."""
        import random

        region_temps = {
            "GA": 85, "NC": 82, "CA": 75, "IL": 78, "FL": 88,
            "CO": 75, "TX": 92, "MA": 75, "WA": 68, "NV": 95, "AZ": 100
        }
        base_temp = region_temps.get(location.state, 75)

        hourly_data = []
        current = start_date

        while current < end_date:
            month = current.month
            seasonal_adj = {
                12: -25, 1: -25, 2: -25,
                3: -10, 4: -10, 5: -10,
                6: 0, 7: 0, 8: 0,
                9: -15, 10: -15, 11: -15
            }.get(month, 0)

            hour = current.hour
            daily_adj = -5 + (hour - 6) if 6 <= hour < 12 else (5 if 12 <= hour < 18 else -3)

            temp = base_temp + seasonal_adj + daily_adj + random.gauss(0, 5)
            wind = max(0, 8 + random.gauss(0, 5))
            precip = random.expovariate(2) if random.random() < 0.15 else 0.0

            hourly_data.append(HourlyWeather(
                timestamp=current,
                temperature_f=round(temp, 1),
                precipitation_inches=round(precip, 2),
                wind_speed_mph=round(wind, 1),
                weather_code=61 if precip > 0.1 else 0
            ))

            current += timedelta(hours=1)

        return WeatherData(
            location_id=location.id,
            latitude=location.latitude,
            longitude=location.longitude,
            hourly_data=hourly_data
        )

    async def get_weather_for_date_range(
        self,
        location: Location,
        start_date: datetime,
        end_date: datetime
    ) -> WeatherData:
        """Get weather data, using cache when available."""
        return await self.fetch_weather(location, start_date, end_date)

    def get_mock_weather_sync(
        self,
        location: Location,
        start_date: datetime,
        end_date: datetime
    ) -> WeatherData:
        """Synchronous method for mock weather generation."""
        return self._generate_mock_weather(location, start_date, end_date)

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()


# Singleton instance
weather_service = WeatherService()
