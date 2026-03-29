"""
Abstract repository interfaces.

Implementations are synchronous — the mock layer is in-memory and needs no I/O.
When a Postgres backend is added, create a postgres/ package alongside mock/,
implement each class (using an async driver like asyncpg if desired), and update
the factory in __init__.py to return the Postgres implementations when DATABASE_URL
is set. The interface can be promoted to async at that point.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import List, Optional

from ..models.booking import Booking, BookingStatus
from ..models.reservation import Location
from ..models.weather import WeatherReading


class BookingRepository(ABC):
    @abstractmethod
    def get_by_id(self, booking_id: str) -> Optional[Booking]: ...

    @abstractmethod
    def get_by_confirmation(self, confirmation_number: str) -> Optional[Booking]: ...

    @abstractmethod
    def list_by_location_and_date(self, location_id: str, scheduled_date: date) -> List[Booking]: ...

    @abstractmethod
    def list_by_date_range(self, location_id: str, start: date, end: date) -> List[Booking]: ...

    @abstractmethod
    def create(self, booking: Booking) -> Booking: ...

    @abstractmethod
    def update_status(self, booking_id: str, status: BookingStatus) -> Optional[Booking]: ...


class WeatherRepository(ABC):
    @abstractmethod
    def get_reading(self, reading_id: str) -> Optional[WeatherReading]: ...

    @abstractmethod
    def get_for_hour(self, location_id: str, dt: datetime) -> Optional[WeatherReading]: ...

    @abstractmethod
    def list_by_range(self, location_id: str, start: datetime, end: datetime) -> List[WeatherReading]: ...

    @abstractmethod
    def upsert(self, reading: WeatherReading) -> WeatherReading: ...


class LocationRepository(ABC):
    @abstractmethod
    def get_by_id(self, location_id: str) -> Optional[Location]: ...

    @abstractmethod
    def list_all(self) -> List[Location]: ...
