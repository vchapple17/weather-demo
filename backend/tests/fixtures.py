"""
Test fixtures for revenue transaction testing.

Use these fixtures for deterministic, reproducible tests.
For property/fuzz testing, use MockDataGenerator with fixed seeds.
"""

from datetime import datetime, timedelta
from typing import List, Dict
from app.models.booking_type import BookingType
from app.models.reservation import (
    Location,
    Reservation,
    HourlyUtilization,
    DeadZone,
    FinancialImpact,
)
from app.config import settings


# =============================================================================
# LOCATION FIXTURES
# =============================================================================

TEST_LOCATION = Location(
    id="test_loc_001",
    name="Test Golf Club",
    latitude=33.7490,
    longitude=-84.3880,
    city="Atlanta",
    state="GA",
    available_booking_types=[
        BookingType.NINE_HOLE,
        BookingType.EIGHTEEN_HOLE,
        BookingType.DRIVING_RANGE,
    ],
)

INDOOR_ONLY_LOCATION = Location(
    id="test_loc_002",
    name="Indoor Golf Center",
    latitude=41.8781,
    longitude=-87.6298,
    city="Chicago",
    state="IL",
    available_booking_types=[
        BookingType.INDOOR_DRIVING_RANGE,
        BookingType.INDOOR_PUTT_PUTT,
    ],
)

FULL_SERVICE_LOCATION = Location(
    id="test_loc_003",
    name="Full Service Golf Resort",
    latitude=26.1224,
    longitude=-80.1373,
    city="Fort Lauderdale",
    state="FL",
    available_booking_types=list(BookingType),
)


# =============================================================================
# WEATHER FIXTURES
# =============================================================================

def make_weather(
    timestamp: datetime,
    temperature_f: float = 72.0,
    wind_speed_mph: float = 5.0,
    precipitation_inches: float = 0.0,
) -> Dict:
    """Factory for weather data."""
    return {
        "timestamp": timestamp,
        "temperature_f": temperature_f,
        "wind_speed_mph": wind_speed_mph,
        "precipitation_inches": precipitation_inches,
        "weather_code": 61 if precipitation_inches > 0.1 else 0,
    }


PERFECT_WEATHER = make_weather(
    timestamp=datetime(2024, 7, 15, 10, 0),
    temperature_f=70.0,
    wind_speed_mph=5.0,
    precipitation_inches=0.0,
)

RAINY_WEATHER = make_weather(
    timestamp=datetime(2024, 7, 15, 10, 0),
    temperature_f=65.0,
    wind_speed_mph=8.0,
    precipitation_inches=0.5,
)

HIGH_WIND_WEATHER = make_weather(
    timestamp=datetime(2024, 7, 15, 10, 0),
    temperature_f=72.0,
    wind_speed_mph=25.0,
    precipitation_inches=0.0,
)

EXTREME_HEAT_WEATHER = make_weather(
    timestamp=datetime(2024, 7, 15, 14, 0),
    temperature_f=102.0,
    wind_speed_mph=3.0,
    precipitation_inches=0.0,
)

COLD_WEATHER = make_weather(
    timestamp=datetime(2024, 1, 15, 10, 0),
    temperature_f=42.0,
    wind_speed_mph=10.0,
    precipitation_inches=0.0,
)


# =============================================================================
# RESERVATION FIXTURES
# =============================================================================

def make_reservation(
    id: str = "res_test_001",
    location_id: str = "test_loc_001",
    booking_type: BookingType = BookingType.EIGHTEEN_HOLE,
    timestamp: datetime = None,
    party_size: int = 4,
    price: float = None,
    duration_minutes: int = None,
) -> Reservation:
    """Factory for creating test reservations."""
    if timestamp is None:
        timestamp = datetime(2024, 7, 15, 9, 30)

    if price is None:
        base_price = settings.PRICING.get(booking_type.value, 20)
        price = base_price * party_size

    if duration_minutes is None:
        durations = {
            BookingType.NINE_HOLE: 120,
            BookingType.EIGHTEEN_HOLE: 240,
            BookingType.DRIVING_RANGE: 60,
            BookingType.INDOOR_DRIVING_RANGE: 60,
            BookingType.OUTDOOR_PUTT_PUTT: 45,
            BookingType.INDOOR_PUTT_PUTT: 45,
        }
        duration_minutes = durations.get(booking_type, 60)

    return Reservation(
        id=id,
        location_id=location_id,
        booking_type=booking_type,
        timestamp=timestamp,
        party_size=party_size,
        price=price,
        duration_minutes=duration_minutes,
    )


# Standard reservation scenarios
STANDARD_18_HOLE = make_reservation(
    id="res_standard_18",
    booking_type=BookingType.EIGHTEEN_HOLE,
    party_size=4,
)

SOLO_RANGE_SESSION = make_reservation(
    id="res_solo_range",
    booking_type=BookingType.DRIVING_RANGE,
    party_size=1,
)

FAMILY_PUTT_PUTT = make_reservation(
    id="res_family_putt",
    booking_type=BookingType.OUTDOOR_PUTT_PUTT,
    party_size=4,
    timestamp=datetime(2024, 7, 15, 15, 0),
)

MAX_PARTY_RESERVATION = make_reservation(
    id="res_max_party",
    booking_type=BookingType.EIGHTEEN_HOLE,
    party_size=8,
)

MIN_PARTY_RESERVATION = make_reservation(
    id="res_min_party",
    booking_type=BookingType.NINE_HOLE,
    party_size=1,
)


# =============================================================================
# UTILIZATION FIXTURES
# =============================================================================

def make_utilization(
    location_id: str = "test_loc_001",
    booking_type: BookingType = BookingType.EIGHTEEN_HOLE,
    date: datetime = None,
    hour: int = 10,
    bookings_count: int = 6,
    capacity: int = None,
    utilization_rate: float = None,
    revenue: float = None,
) -> HourlyUtilization:
    """Factory for creating test utilization records."""
    if date is None:
        date = datetime(2024, 7, 15, hour, 0)

    if capacity is None:
        capacity = settings.CAPACITY_PER_HOUR.get(booking_type.value, 10)

    if utilization_rate is None:
        utilization_rate = bookings_count / capacity if capacity > 0 else 0.0

    if revenue is None:
        revenue = bookings_count * settings.PRICING.get(booking_type.value, 20)

    return HourlyUtilization(
        location_id=location_id,
        booking_type=booking_type,
        date=date,
        hour=hour,
        bookings_count=bookings_count,
        capacity=capacity,
        utilization_rate=round(utilization_rate, 3),
        revenue=round(revenue, 2),
    )


# Utilization scenarios
PEAK_UTILIZATION = make_utilization(
    bookings_count=8,
    capacity=8,
    hour=9,
)

DEAD_ZONE_UTILIZATION = make_utilization(
    bookings_count=1,
    capacity=8,
    hour=14,
)

ZERO_UTILIZATION = make_utilization(
    bookings_count=0,
    capacity=8,
    hour=12,
)

SOLD_OUT_UTILIZATION = make_utilization(
    bookings_count=8,
    capacity=8,
    utilization_rate=1.0,
    hour=10,
)


# =============================================================================
# DEAD ZONE FIXTURES
# =============================================================================

WEATHER_DEAD_ZONE = DeadZone(
    location_id="test_loc_001",
    location_name="Test Golf Club",
    booking_type=BookingType.EIGHTEEN_HOLE,
    date=datetime(2024, 7, 15, 14, 0),
    hour=14,
    utilization_rate=0.10,
    potential_capacity=8,
    lost_revenue=455.0,  # 7 lost bookings * $65
    weather_related=True,
    weather_condition="Heavy Rain",
)

BEHAVIORAL_DEAD_ZONE = DeadZone(
    location_id="test_loc_001",
    location_name="Test Golf Club",
    booking_type=BookingType.DRIVING_RANGE,
    date=datetime(2024, 7, 15, 13, 0),
    hour=13,
    utilization_rate=0.10,
    potential_capacity=20,
    lost_revenue=270.0,  # 18 lost sessions * $15
    weather_related=False,
    weather_condition=None,
)


# =============================================================================
# FINANCIAL IMPACT FIXTURES
# =============================================================================

HIGH_LOSS_IMPACT = FinancialImpact(
    location_id="test_loc_001",
    location_name="Test Golf Club",
    booking_type=BookingType.EIGHTEEN_HOLE,
    total_dead_zone_hours=24,
    total_lost_revenue=10920.0,
    weather_related_losses=6500.0,
    behavior_related_losses=4420.0,
    avg_utilization_during_dead_zones=0.08,
)

MINIMAL_LOSS_IMPACT = FinancialImpact(
    location_id="test_loc_002",
    location_name="Indoor Golf Center",
    booking_type=BookingType.INDOOR_DRIVING_RANGE,
    total_dead_zone_hours=3,
    total_lost_revenue=225.0,
    weather_related_losses=0.0,
    behavior_related_losses=225.0,
    avg_utilization_during_dead_zones=0.12,
)


# =============================================================================
# SCENARIO FIXTURES: Complete datasets for integration tests
# =============================================================================

def generate_full_day_reservations(
    location: Location = TEST_LOCATION,
    date: datetime = datetime(2024, 7, 15),
    pattern: str = "normal",
) -> List[Reservation]:
    """
    Generate a full day of reservations for testing.

    Patterns:
    - "normal": Typical weekday pattern
    - "peak": Sold-out Saturday
    - "dead": Rainy day with minimal bookings
    - "mixed": Variable utilization throughout day
    """
    reservations = []
    counter = 0

    patterns = {
        "normal": {6: 2, 7: 4, 8: 6, 9: 7, 10: 6, 11: 4, 12: 3, 13: 3, 14: 5, 15: 6, 16: 5, 17: 3, 18: 2},
        "peak": {6: 4, 7: 8, 8: 8, 9: 8, 10: 8, 11: 8, 12: 6, 13: 6, 14: 8, 15: 8, 16: 8, 17: 6, 18: 4},
        "dead": {6: 0, 7: 1, 8: 1, 9: 2, 10: 1, 11: 1, 12: 0, 13: 0, 14: 1, 15: 1, 16: 1, 17: 0, 18: 0},
        "mixed": {6: 1, 7: 2, 8: 8, 9: 8, 10: 2, 11: 1, 12: 1, 13: 2, 14: 7, 15: 8, 16: 3, 17: 1, 18: 0},
    }

    hourly_counts = patterns.get(pattern, patterns["normal"])

    for hour, count in hourly_counts.items():
        for i in range(count):
            counter += 1
            reservations.append(make_reservation(
                id=f"res_{location.id}_{counter:04d}",
                location_id=location.id,
                booking_type=BookingType.EIGHTEEN_HOLE,
                timestamp=date.replace(hour=hour, minute=i * 7),
                party_size=4,
            ))

    return reservations


def generate_week_utilization(
    location: Location = TEST_LOCATION,
    start_date: datetime = datetime(2024, 7, 15),
    booking_type: BookingType = BookingType.EIGHTEEN_HOLE,
) -> List[HourlyUtilization]:
    """Generate a week of hourly utilization data with realistic patterns."""
    utilization = []

    # Weekday vs weekend patterns
    weekday_pattern = [0.3, 0.5, 0.75, 0.85, 0.7, 0.5, 0.4, 0.5, 0.65, 0.6, 0.4, 0.2]
    weekend_pattern = [0.5, 0.8, 0.95, 1.0, 0.9, 0.7, 0.6, 0.7, 0.85, 0.8, 0.6, 0.4]

    capacity = settings.CAPACITY_PER_HOUR.get(booking_type.value, 8)
    price = settings.PRICING.get(booking_type.value, 65)

    for day_offset in range(7):
        current_date = start_date + timedelta(days=day_offset)
        is_weekend = current_date.weekday() >= 5
        pattern = weekend_pattern if is_weekend else weekday_pattern

        for hour_idx, util_rate in enumerate(pattern):
            hour = 6 + hour_idx  # 6 AM to 5 PM
            bookings = int(util_rate * capacity)

            utilization.append(HourlyUtilization(
                location_id=location.id,
                booking_type=booking_type,
                date=current_date.replace(hour=hour),
                hour=hour,
                bookings_count=bookings,
                capacity=capacity,
                utilization_rate=round(util_rate, 3),
                revenue=round(bookings * price, 2),
            ))

    return utilization


# Pre-generated scenario datasets
NORMAL_DAY_RESERVATIONS = generate_full_day_reservations(pattern="normal")
PEAK_DAY_RESERVATIONS = generate_full_day_reservations(pattern="peak")
DEAD_DAY_RESERVATIONS = generate_full_day_reservations(pattern="dead")
MIXED_DAY_RESERVATIONS = generate_full_day_reservations(pattern="mixed")

WEEK_UTILIZATION = generate_week_utilization()
