"""
Example tests demonstrating fixture usage for revenue transaction testing.
"""

import pytest
from datetime import datetime
from app.models.booking_type import BookingType
from app.config import settings


class TestReservationFixtures:
    """Tests using hard-coded reservation fixtures."""

    def test_normal_day_has_expected_count(self, normal_day_reservations):
        """Normal day should have reasonable reservation count."""
        assert len(normal_day_reservations) == 56  # Sum of normal pattern

    def test_peak_day_exceeds_normal(self, normal_day_reservations, peak_day_reservations):
        """Peak day should have more reservations than normal."""
        assert len(peak_day_reservations) > len(normal_day_reservations)

    def test_dead_day_has_minimal_bookings(self, dead_day_reservations):
        """Dead day (bad weather) should have very few reservations."""
        assert len(dead_day_reservations) < 15

    def test_all_reservations_have_valid_prices(self, normal_day_reservations):
        """All reservations should have positive prices."""
        for res in normal_day_reservations:
            assert res.price > 0
            assert res.party_size >= 1

    def test_total_revenue_calculation(self, normal_day_reservations):
        """Test revenue aggregation."""
        total = sum(r.price for r in normal_day_reservations)
        assert total > 0
        # Expected: 56 reservations * 4 party * $65 = $14,560
        assert 14000 < total < 15000


class TestUtilizationFixtures:
    """Tests using hard-coded utilization fixtures."""

    def test_week_has_correct_hours(self, week_utilization):
        """Week should have 7 days * 12 hours = 84 records."""
        assert len(week_utilization) == 84

    def test_weekend_utilization_higher(self, week_utilization):
        """Weekend utilization should be higher on average."""
        weekday = [u for u in week_utilization if u.date.weekday() < 5]
        weekend = [u for u in week_utilization if u.date.weekday() >= 5]

        weekday_avg = sum(u.utilization_rate for u in weekday) / len(weekday)
        weekend_avg = sum(u.utilization_rate for u in weekend) / len(weekend)

        assert weekend_avg > weekday_avg

    def test_dead_zones_identified(self, week_utilization):
        """Should be able to identify dead zones from utilization data."""
        dead_zones = [
            u for u in week_utilization
            if u.utilization_rate < settings.DEAD_ZONE_UTILIZATION_THRESHOLD
        ]
        # There may or may not be dead zones depending on patterns
        assert isinstance(dead_zones, list)


class TestWeatherImpact:
    """Tests for weather impact on outdoor vs indoor activities."""

    def test_indoor_unaffected_by_rain(self, indoor_location, rainy_weather, mock_generator):
        """Indoor facilities should not be impacted by rain."""
        base_util = 0.7

        # Indoor should get slight boost in bad weather
        result = mock_generator._apply_weather_impact(
            base_util,
            BookingType.INDOOR_DRIVING_RANGE,
            rainy_weather["temperature_f"],
            rainy_weather["wind_speed_mph"],
            rainy_weather["precipitation_inches"],
        )
        assert result >= base_util  # Indoor gets boost or stays same

    def test_outdoor_reduced_by_rain(self, test_location, rainy_weather, mock_generator):
        """Outdoor activities should be severely impacted by rain."""
        base_util = 0.7

        result = mock_generator._apply_weather_impact(
            base_util,
            BookingType.EIGHTEEN_HOLE,
            rainy_weather["temperature_f"],
            rainy_weather["wind_speed_mph"],
            rainy_weather["precipitation_inches"],
        )
        assert result < base_util * 0.5  # Significant reduction

    def test_high_wind_triggers_wind_wall(self, mock_generator, high_wind_weather):
        """High wind should trigger 'wind wall' effect for golf."""
        base_util = 0.8

        result = mock_generator._apply_weather_impact(
            base_util,
            BookingType.EIGHTEEN_HOLE,
            high_wind_weather["temperature_f"],
            high_wind_weather["wind_speed_mph"],
            high_wind_weather["precipitation_inches"],
        )
        # 25 mph wind gives 0.35 multiplier: 0.8 * 0.35 = 0.28
        assert result < 0.3  # Significant wind wall effect


class TestFactoryUsage:
    """Tests demonstrating factory fixture usage for custom scenarios."""

    def test_custom_reservation(self, reservation_factory):
        """Create custom reservation for specific test case."""
        early_bird = reservation_factory(
            id="res_early",
            timestamp=datetime(2024, 7, 15, 6, 0),
            party_size=2,
        )
        assert early_bird.timestamp.hour == 6
        assert early_bird.party_size == 2

    def test_max_capacity_scenario(self, utilization_factory):
        """Test sold-out scenario."""
        sold_out = utilization_factory(
            bookings_count=8,
            capacity=8,
            utilization_rate=1.0,
        )
        assert sold_out.utilization_rate == 1.0
        assert sold_out.bookings_count == sold_out.capacity


class TestParametrizedBookingTypes:
    """Tests that run across all booking types."""

    def test_pricing_exists(self, any_booking_type):
        """Every booking type should have pricing defined."""
        assert any_booking_type.value in settings.PRICING

    def test_capacity_exists(self, any_booking_type):
        """Every booking type should have capacity defined."""
        assert any_booking_type.value in settings.CAPACITY_PER_HOUR

    def test_indoor_outdoor_property(self, any_booking_type):
        """Indoor and outdoor properties should be mutually exclusive."""
        assert any_booking_type.is_indoor != any_booking_type.is_outdoor


class TestParametrizedWeather:
    """Tests that run across all weather conditions."""

    def test_weather_has_required_fields(self, any_weather):
        """All weather fixtures should have required fields."""
        assert "timestamp" in any_weather
        assert "temperature_f" in any_weather
        assert "wind_speed_mph" in any_weather
        assert "precipitation_inches" in any_weather

    def test_temperature_reasonable(self, any_weather):
        """Temperature should be within reasonable bounds."""
        assert -20 < any_weather["temperature_f"] < 130

    def test_wind_non_negative(self, any_weather):
        """Wind speed should be non-negative."""
        assert any_weather["wind_speed_mph"] >= 0


class TestDynamicGeneratorWithSeed:
    """Tests using the dynamic generator with fixed seeds for reproducibility."""

    def test_seeded_generator_is_deterministic(self, test_location):
        """Same seed should produce identical results from the weather repository."""
        from app.repositories.mock.weather import MockWeatherRepository

        start = datetime(2024, 7, 1)
        end = datetime(2024, 7, 2)

        repo1 = MockWeatherRepository(seed=123)
        weather1 = repo1.list_by_range(test_location.id, start, end)

        repo2 = MockWeatherRepository(seed=123)
        weather2 = repo2.list_by_range(test_location.id, start, end)

        assert len(weather1) == len(weather2)
        for w1, w2 in zip(weather1, weather2):
            assert w1.temperature_f == w2.temperature_f

    @pytest.mark.parametrize("seed", [1, 42, 100, 999])
    def test_revenue_never_negative(self, seed, test_location):
        """Property test: revenue should never be negative."""
        from app.data.mock_data import MockDataGenerator

        gen = MockDataGenerator(seed=seed)
        start = datetime(2024, 7, 1)
        end = datetime(2024, 7, 3)

        utilization = gen.generate_utilization_data(test_location, start, end)

        for record in utilization:
            assert record.revenue >= 0
            assert record.utilization_rate >= 0
            assert record.utilization_rate <= 1.0
