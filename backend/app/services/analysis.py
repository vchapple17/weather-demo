from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from collections import defaultdict
import numpy as np
from ..models.booking_type import BookingType
from ..models.reservation import (
    Location, HourlyUtilization, DeadZone, FinancialImpact, LocationSummary
)
from ..models.weather import WeatherData, HourlyWeather, WeatherCorrelation, WindThreshold
from ..config import settings
from ..data.mock_data import mock_generator
from ..repositories import get_location_repo, get_weather_repo


class AnalysisService:
    def __init__(self):
        self._analysis_cache: Dict[str, any] = {}

    def get_all_locations(self) -> List[Location]:
        """Get all golf facility locations."""
        return get_location_repo().list_all()

    def get_location(self, location_id: str) -> Optional[Location]:
        """Get a specific location by ID."""
        return get_location_repo().get_by_id(location_id)

    def _get_data_range(self) -> Tuple[datetime, datetime]:
        """Get the 6-month historical data range."""
        end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = end_date - timedelta(days=180)
        return start_date, end_date

    def get_utilization_data(
        self,
        location: Location,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> List[HourlyUtilization]:
        """Get hourly utilization data for a location."""
        if start_date is None or end_date is None:
            start_date, end_date = self._get_data_range()

        return mock_generator.generate_utilization_data(location, start_date, end_date)

    def detect_dead_zones(
        self,
        location: Location = None,
        weather_data: WeatherData = None
    ) -> List[DeadZone]:
        """Detect dead zones (low utilization periods) for location(s)."""
        start_date, end_date = self._get_data_range()
        locations = [location] if location else self.get_all_locations()
        dead_zones = []

        for loc in locations:
            utilization_data = self.get_utilization_data(loc, start_date, end_date)

            if weather_data is None:
                weather_readings = get_weather_repo().list_by_range(loc.id, start_date, end_date)
                weather_by_hour = {w.timestamp: w for w in weather_readings}
            else:
                weather_by_hour = {hw.timestamp: hw for hw in weather_data.hourly_data}

            for util in utilization_data:
                if settings.DEAD_ZONE_EXCLUDE_START_HOUR <= util.hour < settings.DEAD_ZONE_EXCLUDE_END_HOUR:
                    continue

                if util.utilization_rate < settings.DEAD_ZONE_UTILIZATION_THRESHOLD:
                    weather_hour = weather_by_hour.get(util.date)

                    weather_related = False
                    weather_condition = None

                    if weather_hour and util.booking_type.is_outdoor:
                        precip = weather_hour.precipitation_inches
                        wind = weather_hour.wind_speed_mph
                        temp = weather_hour.temperature_f

                        if precip > 0.1:
                            weather_related = True
                            weather_condition = "Rain"
                        elif wind > 15:
                            weather_related = True
                            weather_condition = f"High Wind ({wind:.0f} mph)"
                        elif temp < 50 or temp > 95:
                            weather_related = True
                            weather_condition = f"Extreme Temp ({temp:.0f}°F)"

                    lost_revenue = (util.capacity - util.bookings_count) * settings.PRICING.get(
                        util.booking_type.value, 20
                    )

                    dead_zones.append(DeadZone(
                        location_id=loc.id,
                        location_name=loc.name,
                        booking_type=util.booking_type,
                        date=util.date,
                        hour=util.hour,
                        utilization_rate=util.utilization_rate,
                        potential_capacity=util.capacity,
                        lost_revenue=round(lost_revenue, 2),
                        weather_related=weather_related,
                        weather_condition=weather_condition
                    ))

        return dead_zones

    def analyze_weather_correlation(
        self,
        location: Location = None
    ) -> List[WeatherCorrelation]:
        """Analyze correlation between weather and utilization."""
        start_date, end_date = self._get_data_range()
        locations = [location] if location else self.get_all_locations()

        data_points: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: defaultdict(list))
        baseline_data: Dict[str, List[float]] = defaultdict(list)

        for loc in locations:
            utilization_data = self.get_utilization_data(loc, start_date, end_date)
            weather_readings = get_weather_repo().list_by_range(loc.id, start_date, end_date)
            weather_by_hour = {w.timestamp: w for w in weather_readings}

            for util in utilization_data:
                if util.booking_type.is_indoor:
                    continue

                weather_hour = weather_by_hour.get(util.date)
                if not weather_hour:
                    continue

                booking_key = util.booking_type.value
                baseline_data[booking_key].append(util.utilization_rate)

                precip = weather_hour.precipitation_inches
                wind = weather_hour.wind_speed_mph
                temp = weather_hour.temperature_f

                if precip > 0.1:
                    condition = "Rainy"
                elif wind > 20:
                    condition = "Very Windy (>20 mph)"
                elif wind > 15:
                    condition = "Windy (15-20 mph)"
                elif temp < 50:
                    condition = "Cold (<50°F)"
                elif temp > 90:
                    condition = "Hot (>90°F)"
                elif 60 <= temp <= 75 and wind < 10 and precip < 0.01:
                    condition = "Perfect"
                else:
                    condition = "Fair"

                data_points[booking_key][condition].append(util.utilization_rate)

        # Calculate correlations
        correlations = []
        for booking_type, conditions in data_points.items():
            baseline_avg = np.mean(baseline_data[booking_type]) if baseline_data[booking_type] else 0.5

            for condition, rates in conditions.items():
                if len(rates) < 10:  # Skip if not enough samples
                    continue

                avg_util = np.mean(rates)
                impact = ((avg_util - baseline_avg) / baseline_avg) * 100 if baseline_avg > 0 else 0

                correlations.append(WeatherCorrelation(
                    booking_type=booking_type,
                    weather_condition=condition,
                    avg_utilization=round(avg_util, 3),
                    sample_count=len(rates),
                    baseline_utilization=round(baseline_avg, 3),
                    utilization_impact=round(impact, 1)
                ))

        return sorted(correlations, key=lambda x: x.utilization_impact)

    def find_wind_threshold(self, location: Location = None) -> List[WindThreshold]:
        """Find the 'Wind Wall' - MPH at which utilization collapses."""
        start_date, end_date = self._get_data_range()
        locations = [location] if location else self.get_all_locations()

        wind_data: Dict[str, List[Tuple[float, float]]] = defaultdict(list)

        for loc in locations:
            utilization_data = self.get_utilization_data(loc, start_date, end_date)
            weather_readings = get_weather_repo().list_by_range(loc.id, start_date, end_date)
            weather_by_hour = {w.timestamp: w for w in weather_readings}

            for util in utilization_data:
                if util.booking_type.is_indoor:
                    continue

                weather_hour = weather_by_hour.get(util.date)
                if not weather_hour:
                    continue

                if weather_hour.precipitation_inches < 0.05:
                    wind_data[util.booking_type.value].append(
                        (weather_hour.wind_speed_mph, util.utilization_rate)
                    )

        # Find threshold for each outdoor booking type
        thresholds = []
        for booking_type, data in wind_data.items():
            if len(data) < 100:
                continue

            # Test different thresholds
            best_threshold = 15
            best_diff = 0

            for test_mph in range(10, 26):
                below = [u for w, u in data if w <= test_mph]
                above = [u for w, u in data if w > test_mph]

                if len(below) > 20 and len(above) > 20:
                    diff = np.mean(below) - np.mean(above)
                    if diff > best_diff:
                        best_diff = diff
                        best_threshold = test_mph

            below_rates = [u for w, u in data if w <= best_threshold]
            above_rates = [u for w, u in data if w > best_threshold]

            if below_rates and above_rates:
                thresholds.append(WindThreshold(
                    booking_type=booking_type,
                    wind_wall_mph=float(best_threshold),
                    utilization_below_threshold=round(np.mean(below_rates), 3),
                    utilization_above_threshold=round(np.mean(above_rates), 3),
                    confidence_score=round(min(1.0, len(data) / 500), 2)
                ))

        return thresholds

    def analyze_behavior_driven_dead_zones(self, location: Location = None) -> List[DeadZone]:
        """Find dead zones during perfect weather (behavior-driven, not weather-driven)."""
        start_date, end_date = self._get_data_range()
        locations = [location] if location else self.get_all_locations()
        behavior_dead_zones = []

        for loc in locations:
            utilization_data = self.get_utilization_data(loc, start_date, end_date)
            weather_readings = get_weather_repo().list_by_range(loc.id, start_date, end_date)
            weather_by_hour = {w.timestamp: w for w in weather_readings}

            for util in utilization_data:
                if settings.DEAD_ZONE_EXCLUDE_START_HOUR <= util.hour < settings.DEAD_ZONE_EXCLUDE_END_HOUR:
                    continue

                if util.utilization_rate >= settings.DEAD_ZONE_UTILIZATION_THRESHOLD:
                    continue

                weather_hour = weather_by_hour.get(util.date)
                if not weather_hour:
                    continue

                temp = weather_hour.temperature_f
                wind = weather_hour.wind_speed_mph
                precip = weather_hour.precipitation_inches

                is_perfect = (
                    settings.PERFECT_TEMP_MIN <= temp <= settings.PERFECT_TEMP_MAX
                    and wind <= settings.PERFECT_WIND_MAX
                    and precip <= settings.PERFECT_PRECIP_MAX
                )

                # For indoor, consider it behavior-driven if during normal hours
                if util.booking_type.is_indoor or is_perfect:
                    lost_revenue = (util.capacity - util.bookings_count) * settings.PRICING.get(
                        util.booking_type.value, 20
                    )

                    behavior_dead_zones.append(DeadZone(
                        location_id=loc.id,
                        location_name=loc.name,
                        booking_type=util.booking_type,
                        date=util.date,
                        hour=util.hour,
                        utilization_rate=util.utilization_rate,
                        potential_capacity=util.capacity,
                        lost_revenue=round(lost_revenue, 2),
                        weather_related=False,
                        weather_condition="Perfect" if is_perfect else "N/A (Indoor)"
                    ))

        return behavior_dead_zones

    def calculate_financial_impact(self, location: Location = None) -> List[FinancialImpact]:
        """Calculate financial impact of dead zones."""
        all_dead_zones = self.detect_dead_zones(location)
        behavior_dead_zones = self.analyze_behavior_driven_dead_zones(location)

        # Group by location and booking type
        impact_data: Dict[Tuple[str, str], Dict] = defaultdict(lambda: {
            "location_name": "",
            "total_hours": 0,
            "total_lost": 0.0,
            "weather_lost": 0.0,
            "behavior_lost": 0.0,
            "utilization_rates": []
        })

        for dz in all_dead_zones:
            key = (dz.location_id, dz.booking_type.value)
            impact_data[key]["location_name"] = dz.location_name
            impact_data[key]["total_hours"] += 1
            impact_data[key]["total_lost"] += dz.lost_revenue
            if dz.weather_related:
                impact_data[key]["weather_lost"] += dz.lost_revenue
            impact_data[key]["utilization_rates"].append(dz.utilization_rate)

        for dz in behavior_dead_zones:
            key = (dz.location_id, dz.booking_type.value)
            if not dz.weather_related:
                impact_data[key]["behavior_lost"] += dz.lost_revenue

        # Build financial impact records
        impacts = []
        for (location_id, booking_type), data in impact_data.items():
            if data["total_hours"] == 0:
                continue

            impacts.append(FinancialImpact(
                location_id=location_id,
                location_name=data["location_name"],
                booking_type=BookingType(booking_type),
                total_dead_zone_hours=data["total_hours"],
                total_lost_revenue=round(data["total_lost"], 2),
                weather_related_losses=round(data["weather_lost"], 2),
                behavior_related_losses=round(data["behavior_lost"], 2),
                avg_utilization_during_dead_zones=round(
                    np.mean(data["utilization_rates"]) if data["utilization_rates"] else 0, 3
                )
            ))

        return sorted(impacts, key=lambda x: x.total_lost_revenue, reverse=True)

    def get_location_summary(self, location: Location) -> LocationSummary:
        """Get summary statistics for a location."""
        start_date, end_date = self._get_data_range()
        utilization_data = self.get_utilization_data(location, start_date, end_date)
        reservations = mock_generator.generate_reservations(location, start_date, end_date)
        dead_zones = self.detect_dead_zones(location)

        total_revenue = sum(r.price for r in reservations)
        avg_utilization = np.mean([u.utilization_rate for u in utilization_data])
        dead_zone_loss = sum(dz.lost_revenue for dz in dead_zones)

        return LocationSummary(
            location=location,
            total_reservations=len(reservations),
            total_revenue=round(total_revenue, 2),
            avg_utilization=round(avg_utilization, 3),
            dead_zone_count=len(dead_zones),
            dead_zone_revenue_loss=round(dead_zone_loss, 2)
        )

    def get_chart_data(self, chart_type: str, location_id: str = None) -> Dict:
        """Generate data for various chart types."""
        location = self.get_location(location_id) if location_id else None

        if chart_type == "utilization_by_hour":
            return self._chart_utilization_by_hour(location)
        elif chart_type == "wind_correlation":
            return self._chart_wind_correlation(location)
        elif chart_type == "revenue_impact":
            return self._chart_revenue_impact(location)
        elif chart_type == "booking_type_breakdown":
            return self._chart_booking_type_breakdown(location)
        else:
            return {"error": f"Unknown chart type: {chart_type}"}

    def _chart_utilization_by_hour(self, location: Location = None) -> Dict:
        """Generate utilization by hour chart data."""
        start_date, end_date = self._get_data_range()
        locations = [location] if location else self.get_all_locations()

        hourly_data: Dict[int, List[float]] = defaultdict(list)

        for loc in locations:
            utilization_data = self.get_utilization_data(loc, start_date, end_date)
            for util in utilization_data:
                hourly_data[util.hour].append(util.utilization_rate)

        return {
            "labels": [f"{h}:00" for h in range(6, 21)],
            "datasets": [{
                "label": "Average Utilization",
                "data": [
                    round(np.mean(hourly_data[h]) * 100, 1) if hourly_data[h] else 0
                    for h in range(6, 21)
                ]
            }]
        }

    def _chart_wind_correlation(self, location: Location = None) -> Dict:
        """Generate wind correlation chart data."""
        start_date, end_date = self._get_data_range()
        locations = [location] if location else self.get_all_locations()

        wind_buckets = [(0, 5), (5, 10), (10, 15), (15, 20), (20, 25), (25, 100)]
        bucket_data: Dict[str, List[float]] = defaultdict(list)

        for loc in locations:
            utilization_data = self.get_utilization_data(loc, start_date, end_date)
            weather_readings = get_weather_repo().list_by_range(loc.id, start_date, end_date)
            weather_by_hour = {w.timestamp: w for w in weather_readings}

            for util in utilization_data:
                if util.booking_type.is_indoor:
                    continue

                weather_hour = weather_by_hour.get(util.date)
                if not weather_hour or weather_hour.precipitation_inches > 0.05:
                    continue

                wind = weather_hour.wind_speed_mph
                for low, high in wind_buckets:
                    if low <= wind < high:
                        label = f"{low}-{high}" if high < 100 else f"{low}+"
                        bucket_data[label].append(util.utilization_rate)
                        break

        labels = ["0-5", "5-10", "10-15", "15-20", "20-25", "25+"]
        return {
            "labels": labels,
            "datasets": [{
                "label": "Utilization by Wind Speed (mph)",
                "data": [
                    round(np.mean(bucket_data[l]) * 100, 1) if bucket_data[l] else 0
                    for l in labels
                ]
            }]
        }

    def _chart_revenue_impact(self, location: Location = None) -> Dict:
        """Generate revenue impact chart data."""
        impacts = self.calculate_financial_impact(location)

        # Group by location
        location_totals: Dict[str, Dict[str, float]] = defaultdict(lambda: {"weather": 0, "behavior": 0})
        for impact in impacts:
            location_totals[impact.location_name]["weather"] += impact.weather_related_losses
            location_totals[impact.location_name]["behavior"] += impact.behavior_related_losses

        # Get top 10 locations by total loss
        sorted_locations = sorted(
            location_totals.items(),
            key=lambda x: x[1]["weather"] + x[1]["behavior"],
            reverse=True
        )[:10]

        return {
            "labels": [loc for loc, _ in sorted_locations],
            "datasets": [
                {
                    "label": "Weather-Related Losses",
                    "data": [round(data["weather"], 2) for _, data in sorted_locations]
                },
                {
                    "label": "Behavior-Related Losses",
                    "data": [round(data["behavior"], 2) for _, data in sorted_locations]
                }
            ]
        }

    def _chart_booking_type_breakdown(self, location: Location = None) -> Dict:
        """Generate booking type breakdown chart data."""
        impacts = self.calculate_financial_impact(location)

        type_totals: Dict[str, float] = defaultdict(float)
        for impact in impacts:
            type_totals[impact.booking_type.display_name] += impact.total_lost_revenue

        sorted_types = sorted(type_totals.items(), key=lambda x: x[1], reverse=True)

        return {
            "labels": [t for t, _ in sorted_types],
            "datasets": [{
                "label": "Lost Revenue by Booking Type",
                "data": [round(v, 2) for _, v in sorted_types]
            }]
        }


# Singleton instance
analysis_service = AnalysisService()
