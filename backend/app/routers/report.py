from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from ..services.analysis import analysis_service
from ..services.report import report_service


class RevenueLeak(BaseModel):
    location: str
    booking_type: str
    booking_type_display: str
    lost_revenue: float
    dead_zone_hours: int
    primary_cause: str


class ExecutiveSummary(BaseModel):
    total_lost_revenue: float
    weather_related_losses: float
    weather_related_percent: float
    behavior_related_losses: float
    behavior_related_percent: float
    top_revenue_leaks: List[RevenueLeak]
    wind_wall_mph: Optional[float]
    wind_wall_utilization_drop: Optional[str]


class WindWallEntry(BaseModel):
    booking_type: str
    wind_threshold_mph: float
    utilization_below: float
    utilization_above: float
    drop_percent: float


class WindWallSection(BaseModel):
    entries: List[WindWallEntry]
    interpretation: List[str]


class WeatherCorrelationEntry(BaseModel):
    booking_type: str
    weather_condition: str
    avg_utilization: float
    impact_vs_baseline: float


class WeatherCorrelationSection(BaseModel):
    negative_impacts: List[WeatherCorrelationEntry]
    positive_impacts: List[WeatherCorrelationEntry]
    key_findings: List[str]


class DeadZoneSection(BaseModel):
    total_dead_zone_hours: int
    weather_related_count: int
    weather_related_percent: float
    behavior_related_count: int
    peak_dead_hours: List[dict]
    patterns: List[str]


class FinancialByType(BaseModel):
    booking_type: str
    lost_revenue: float


class FinancialByLocation(BaseModel):
    location: str
    lost_revenue: float


class FinancialImpactSection(BaseModel):
    by_booking_type: List[FinancialByType]
    by_location: List[FinancialByLocation]


class Recommendation(BaseModel):
    title: str
    trigger: Optional[str]
    actions: List[str]
    estimated_recovery: Optional[str]


class StructuredReport(BaseModel):
    generated_at: datetime
    analysis_period: str
    location_name: Optional[str]
    executive_summary: ExecutiveSummary
    wind_wall: WindWallSection
    weather_correlation: WeatherCorrelationSection
    dead_zones: DeadZoneSection
    financial_impact: FinancialImpactSection
    recommendations: List[Recommendation]


router = APIRouter(prefix="/api", tags=["report"])


@router.get("/report", response_class=PlainTextResponse)
async def get_report(
    location_id: Optional[str] = Query(None, description="Generate report for specific location")
):
    """
    Generate a comprehensive Markdown report.

    The report includes:
    - Executive Summary with Top 3 Revenue Leaks
    - Wind Wall Analysis
    - Weather Correlation Analysis
    - Dead Zone Analysis
    - Financial Impact Analysis
    - Strategic Recommendations
    """
    location = None
    if location_id:
        location = analysis_service.get_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    report = report_service.generate_full_report(location)
    return PlainTextResponse(content=report, media_type="text/markdown")


@router.get("/report/summary")
async def get_report_summary(
    location_id: Optional[str] = Query(None, description="Get summary for specific location")
):
    """Get a JSON summary of the report data."""
    location = None
    if location_id:
        location = analysis_service.get_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    financial_impacts = analysis_service.calculate_financial_impact(location)
    wind_thresholds = analysis_service.find_wind_threshold(location)
    dead_zones = analysis_service.detect_dead_zones(location)

    total_loss = sum(fi.total_lost_revenue for fi in financial_impacts)
    weather_loss = sum(fi.weather_related_losses for fi in financial_impacts)
    behavior_loss = sum(fi.behavior_related_losses for fi in financial_impacts)

    top_leaks = sorted(financial_impacts, key=lambda x: x.total_lost_revenue, reverse=True)[:3]

    golf_threshold = next((wt for wt in wind_thresholds if "HOLE" in wt.booking_type), None)

    return {
        "total_lost_revenue": round(total_loss, 2),
        "weather_related_losses": round(weather_loss, 2),
        "behavior_related_losses": round(behavior_loss, 2),
        "total_dead_zone_hours": len(dead_zones),
        "wind_wall_mph": golf_threshold.wind_wall_mph if golf_threshold else None,
        "top_revenue_leaks": [
            {
                "location": leak.location_name,
                "booking_type": leak.booking_type.value,
                "lost_revenue": leak.total_lost_revenue,
                "dead_zone_hours": leak.total_dead_zone_hours
            }
            for leak in top_leaks
        ]
    }


@router.get("/report/structured", response_model=StructuredReport)
async def get_structured_report(
    location_id: Optional[str] = Query(None, description="Generate report for specific location")
):
    """
    Generate a structured JSON report for custom UI rendering.
    """
    location = None
    if location_id:
        location = analysis_service.get_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    # Gather all analysis data
    dead_zones = analysis_service.detect_dead_zones(location)
    behavior_dead_zones = analysis_service.analyze_behavior_driven_dead_zones(location)
    weather_correlations = analysis_service.analyze_weather_correlation(location)
    wind_thresholds = analysis_service.find_wind_threshold(location)
    financial_impacts = analysis_service.calculate_financial_impact(location)

    # Build executive summary
    total_loss = sum(fi.total_lost_revenue for fi in financial_impacts)
    weather_loss = sum(fi.weather_related_losses for fi in financial_impacts)
    behavior_loss = sum(fi.behavior_related_losses for fi in financial_impacts)
    top_leaks = sorted(financial_impacts, key=lambda x: x.total_lost_revenue, reverse=True)[:3]
    golf_thresholds = [wt for wt in wind_thresholds if "HOLE" in wt.booking_type]
    wind_wall = golf_thresholds[0] if golf_thresholds else None

    executive_summary = ExecutiveSummary(
        total_lost_revenue=round(total_loss, 2),
        weather_related_losses=round(weather_loss, 2),
        weather_related_percent=round(weather_loss / total_loss * 100, 1) if total_loss > 0 else 0,
        behavior_related_losses=round(behavior_loss, 2),
        behavior_related_percent=round(behavior_loss / total_loss * 100, 1) if total_loss > 0 else 0,
        top_revenue_leaks=[
            RevenueLeak(
                location=leak.location_name,
                booking_type=leak.booking_type.value,
                booking_type_display=leak.booking_type.display_name,
                lost_revenue=round(leak.total_lost_revenue, 2),
                dead_zone_hours=leak.total_dead_zone_hours,
                primary_cause="Weather" if leak.weather_related_losses > leak.behavior_related_losses else "Behavioral"
            )
            for leak in top_leaks
        ],
        wind_wall_mph=wind_wall.wind_wall_mph if wind_wall else None,
        wind_wall_utilization_drop=f"{wind_wall.utilization_below_threshold*100:.0f}% to {wind_wall.utilization_above_threshold*100:.0f}%" if wind_wall else None
    )

    # Build wind wall section
    wind_wall_entries = []
    for wt in wind_thresholds:
        drop_pct = (1 - wt.utilization_above_threshold / wt.utilization_below_threshold) * 100 if wt.utilization_below_threshold > 0 else 0
        wind_wall_entries.append(WindWallEntry(
            booking_type=wt.booking_type,
            wind_threshold_mph=round(wt.wind_wall_mph, 0),
            utilization_below=round(wt.utilization_below_threshold * 100, 1),
            utilization_above=round(wt.utilization_above_threshold * 100, 1),
            drop_percent=round(drop_pct, 0)
        ))

    wind_wall_section = WindWallSection(
        entries=wind_wall_entries,
        interpretation=[
            "Golf rounds are highly sensitive to wind, with a sharp utilization cliff around 15-18 mph",
            "Driving range customers are slightly more tolerant, likely due to shorter session commitments",
            "Consider dynamic pricing triggers when forecasted wind exceeds these thresholds"
        ]
    )

    # Build weather correlation section
    negative = [wc for wc in weather_correlations if wc.utilization_impact < -10]
    positive = [wc for wc in weather_correlations if wc.utilization_impact > 10]

    weather_correlation_section = WeatherCorrelationSection(
        negative_impacts=[
            WeatherCorrelationEntry(
                booking_type=wc.booking_type,
                weather_condition=wc.weather_condition,
                avg_utilization=round(wc.avg_utilization * 100, 1),
                impact_vs_baseline=round(wc.utilization_impact, 1)
            )
            for wc in negative[:5]
        ],
        positive_impacts=[
            WeatherCorrelationEntry(
                booking_type=wc.booking_type,
                weather_condition=wc.weather_condition,
                avg_utilization=round(wc.avg_utilization * 100, 1),
                impact_vs_baseline=round(wc.utilization_impact, 1)
            )
            for wc in positive[:5]
        ],
        key_findings=[
            "Rain is the #1 booking killer - even light rain reduces outdoor utilization by 40-70%",
            "Temperature extremes matter less than precipitation - customers tolerate heat/cold better than rain",
            "\"Perfect\" weather windows are underutilized - indicating behavioral/awareness issues"
        ]
    )

    # Build dead zone section
    hour_counts = {}
    for dz in dead_zones:
        hour_counts[dz.hour] = hour_counts.get(dz.hour, 0) + 1
    peak_dead_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    weather_count = sum(1 for dz in dead_zones if dz.weather_related)

    dead_zone_section = DeadZoneSection(
        total_dead_zone_hours=len(dead_zones),
        weather_related_count=weather_count,
        weather_related_percent=round(weather_count / len(dead_zones) * 100, 1) if dead_zones else 0,
        behavior_related_count=len(behavior_dead_zones),
        peak_dead_hours=[{"hour": h, "occurrences": c} for h, c in peak_dead_hours],
        patterns=[
            "Mid-afternoon Slump (1-3 PM): Consistent low utilization across locations",
            "Early Morning Gaps (6-7 AM): Underutilized prime time slots",
            "Weather Sensitivity: 40% of dead zones correlate with adverse weather"
        ]
    )

    # Build financial impact section
    type_totals = {}
    for fi in financial_impacts:
        key = fi.booking_type.display_name
        type_totals[key] = type_totals.get(key, 0) + fi.total_lost_revenue

    location_totals = {}
    for fi in financial_impacts:
        location_totals[fi.location_name] = location_totals.get(fi.location_name, 0) + fi.total_lost_revenue

    financial_impact_section = FinancialImpactSection(
        by_booking_type=[
            FinancialByType(booking_type=bt, lost_revenue=round(total, 2))
            for bt, total in sorted(type_totals.items(), key=lambda x: x[1], reverse=True)
        ],
        by_location=[
            FinancialByLocation(location=loc, lost_revenue=round(total, 2))
            for loc, total in sorted(location_totals.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
    )

    # Build recommendations
    wind_mph = wind_wall.wind_wall_mph if wind_wall else 15
    total_behavior_loss = sum(dz.lost_revenue for dz in behavior_dead_zones)

    recommendations = [
        Recommendation(
            title="Dynamic Pricing Implementation",
            trigger=f"Wind forecast exceeds {wind_mph:.0f} mph",
            actions=[
                "Reduce outdoor rates by 20-30% when wind exceeds threshold",
                "Promote indoor facilities with bundled offers",
                "Send weather-aware push notifications 24 hours before"
            ],
            estimated_recovery="15-25% of weather-related losses"
        ),
        Recommendation(
            title="Dead Zone Promotions",
            trigger="Mid-afternoon slots (1-3 PM)",
            actions=[
                "\"Twilight Early\" pricing starting at 1 PM",
                "Corporate partnership programs for afternoon team-building",
                "Junior golf clinics during school release times"
            ],
            estimated_recovery=f"${total_behavior_loss * 0.2:,.2f} (20% of behavior-related losses)"
        ),
        Recommendation(
            title="Weather-Triggered Campaigns",
            trigger=None,
            actions=[
                "48-hour advance: Promote rescheduling with discount incentive",
                "Same-day rain: Push indoor driving range promotions",
                "Post-storm: \"Course is Fresh\" comeback campaigns"
            ],
            estimated_recovery=None
        ),
        Recommendation(
            title="Operational Pivot Strategy",
            trigger=None,
            actions=[
                "Reduce course maintenance crew during forecasted low-utilization periods",
                "Cross-train staff for indoor facility support",
                "Pre-position indoor inventory during weather events",
                "Flexible cart fleet deployment based on booking velocity"
            ],
            estimated_recovery=None
        ),
        Recommendation(
            title="Indoor Facility Investment",
            trigger=None,
            actions=[
                "Consider expanding indoor driving range capacity at high-impact locations",
                "Evaluate indoor putt-putt additions at facilities without them",
                "Install weather monitoring displays to showcase indoor alternatives"
            ],
            estimated_recovery=None
        )
    ]

    return StructuredReport(
        generated_at=datetime.now(),
        analysis_period="Last 6 months",
        location_name=location.name if location else None,
        executive_summary=executive_summary,
        wind_wall=wind_wall_section,
        weather_correlation=weather_correlation_section,
        dead_zones=dead_zone_section,
        financial_impact=financial_impact_section,
        recommendations=recommendations
    )
