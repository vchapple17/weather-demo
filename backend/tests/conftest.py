"""
Pytest configuration and shared fixtures.
"""

import pytest
from datetime import datetime
from typing import List

from app.models.booking_type import BookingType
from app.models.reservation import Location, Reservation, HourlyUtilization
from app.data.mock_data import MockDataGenerator  # computation algorithms only; data from repos

from .fixtures import (
    # Locations
    TEST_LOCATION,
    INDOOR_ONLY_LOCATION,
    FULL_SERVICE_LOCATION,
    # Weather
    PERFECT_WEATHER,
    RAINY_WEATHER,
    HIGH_WIND_WEATHER,
    EXTREME_HEAT_WEATHER,
    COLD_WEATHER,
    # Factories
    make_reservation,
    make_utilization,
    make_weather,
    # Scenario data
    NORMAL_DAY_RESERVATIONS,
    PEAK_DAY_RESERVATIONS,
    DEAD_DAY_RESERVATIONS,
    WEEK_UTILIZATION,
)


# =============================================================================
# LOCATION FIXTURES
# =============================================================================

@pytest.fixture
def test_location() -> Location:
    return TEST_LOCATION


@pytest.fixture
def indoor_location() -> Location:
    return INDOOR_ONLY_LOCATION


@pytest.fixture
def full_service_location() -> Location:
    return FULL_SERVICE_LOCATION


# =============================================================================
# WEATHER FIXTURES
# =============================================================================

@pytest.fixture
def perfect_weather():
    return PERFECT_WEATHER.copy()


@pytest.fixture
def rainy_weather():
    return RAINY_WEATHER.copy()


@pytest.fixture
def high_wind_weather():
    return HIGH_WIND_WEATHER.copy()


@pytest.fixture
def extreme_heat_weather():
    return EXTREME_HEAT_WEATHER.copy()


@pytest.fixture
def cold_weather():
    return COLD_WEATHER.copy()


# =============================================================================
# MOCK DATA GENERATOR FIXTURES
# =============================================================================

@pytest.fixture
def mock_generator() -> MockDataGenerator:
    """Returns a seeded mock generator for reproducible tests."""
    return MockDataGenerator(seed=42)


@pytest.fixture
def mock_generator_random() -> MockDataGenerator:
    """Returns a generator with a random seed for fuzz testing."""
    import random
    return MockDataGenerator(seed=random.randint(0, 10000))


# =============================================================================
# RESERVATION FIXTURES
# =============================================================================

@pytest.fixture
def single_reservation() -> Reservation:
    return make_reservation()


@pytest.fixture
def normal_day_reservations() -> List[Reservation]:
    return NORMAL_DAY_RESERVATIONS.copy()


@pytest.fixture
def peak_day_reservations() -> List[Reservation]:
    return PEAK_DAY_RESERVATIONS.copy()


@pytest.fixture
def dead_day_reservations() -> List[Reservation]:
    return DEAD_DAY_RESERVATIONS.copy()


# =============================================================================
# UTILIZATION FIXTURES
# =============================================================================

@pytest.fixture
def week_utilization() -> List[HourlyUtilization]:
    return WEEK_UTILIZATION.copy()


# =============================================================================
# FACTORY FIXTURES (for custom test data)
# =============================================================================

@pytest.fixture
def reservation_factory():
    """Returns the reservation factory for creating custom test data."""
    return make_reservation


@pytest.fixture
def utilization_factory():
    """Returns the utilization factory for creating custom test data."""
    return make_utilization


@pytest.fixture
def weather_factory():
    """Returns the weather factory for creating custom test data."""
    return make_weather


# =============================================================================
# PARAMETRIZED FIXTURES
# =============================================================================

@pytest.fixture(params=list(BookingType))
def any_booking_type(request) -> BookingType:
    """Parametrized fixture that runs test for each booking type."""
    return request.param


@pytest.fixture(params=[bt for bt in BookingType if bt.is_outdoor])
def outdoor_booking_type(request) -> BookingType:
    """Parametrized fixture for outdoor booking types only."""
    return request.param


@pytest.fixture(params=[bt for bt in BookingType if bt.is_indoor])
def indoor_booking_type(request) -> BookingType:
    """Parametrized fixture for indoor booking types only."""
    return request.param


@pytest.fixture(params=[
    PERFECT_WEATHER,
    RAINY_WEATHER,
    HIGH_WIND_WEATHER,
    EXTREME_HEAT_WEATHER,
    COLD_WEATHER,
])
def any_weather(request):
    """Parametrized fixture that runs test for each weather condition."""
    return request.param.copy()
