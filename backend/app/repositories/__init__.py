"""
Repository factory.

Usage:
    from app.repositories import get_booking_repo, get_weather_repo, get_location_repo

To add Postgres: create repositories/postgres/ implementing the base classes,
then swap the return values below when settings.DATABASE_URL is set.
"""
from __future__ import annotations

from functools import lru_cache

from .base import BookingRepository, LocationRepository, WeatherRepository
from .mock import MockBookingRepository, MockLocationRepository, MockWeatherRepository


@lru_cache(maxsize=1)
def get_booking_repo() -> BookingRepository:
    # TODO: if settings.DATABASE_URL: return PostgresBookingRepository()
    return MockBookingRepository()


@lru_cache(maxsize=1)
def get_weather_repo() -> WeatherRepository:
    # TODO: if settings.DATABASE_URL: return PostgresWeatherRepository()
    return MockWeatherRepository()


@lru_cache(maxsize=1)
def get_location_repo() -> LocationRepository:
    # TODO: if settings.DATABASE_URL: return PostgresLocationRepository()
    return MockLocationRepository()
