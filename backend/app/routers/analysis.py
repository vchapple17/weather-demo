from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..models.reservation import Location, DeadZone, FinancialImpact, LocationSummary
from ..models.weather import WeatherCorrelation, WindThreshold
from ..services.analysis import analysis_service

router = APIRouter(prefix="/api", tags=["analysis"])


@router.get("/locations", response_model=List[Location])
async def get_locations():
    """Get all golf facility locations."""
    return analysis_service.get_all_locations()


@router.get("/locations/{location_id}", response_model=Location)
async def get_location(location_id: str):
    """Get a specific location by ID."""
    location = analysis_service.get_location(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.get("/locations/{location_id}/summary", response_model=LocationSummary)
async def get_location_summary(location_id: str):
    """Get summary statistics for a location."""
    location = analysis_service.get_location(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return analysis_service.get_location_summary(location)


@router.get("/analysis/dead-zones", response_model=List[DeadZone])
async def get_dead_zones(
    location_id: Optional[str] = Query(None, description="Filter by location ID"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results")
):
    """Get dead zone analysis - periods with low utilization."""
    location = None
    if location_id:
        location = analysis_service.get_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    dead_zones = analysis_service.detect_dead_zones(location)
    return dead_zones[:limit]


@router.get("/analysis/weather-correlation", response_model=List[WeatherCorrelation])
async def get_weather_correlation(
    location_id: Optional[str] = Query(None, description="Filter by location ID")
):
    """Get weather correlation analysis for outdoor activities."""
    location = None
    if location_id:
        location = analysis_service.get_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    return analysis_service.analyze_weather_correlation(location)


@router.get("/analysis/wind-threshold", response_model=List[WindThreshold])
async def get_wind_threshold(
    location_id: Optional[str] = Query(None, description="Filter by location ID")
):
    """Get wind threshold analysis - the 'Wind Wall' where utilization collapses."""
    location = None
    if location_id:
        location = analysis_service.get_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    return analysis_service.find_wind_threshold(location)


@router.get("/analysis/behavior-dead-zones", response_model=List[DeadZone])
async def get_behavior_dead_zones(
    location_id: Optional[str] = Query(None, description="Filter by location ID"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results")
):
    """Get behavior-driven dead zones - low utilization during perfect weather."""
    location = None
    if location_id:
        location = analysis_service.get_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    dead_zones = analysis_service.analyze_behavior_driven_dead_zones(location)
    return dead_zones[:limit]


@router.get("/analysis/financial-impact", response_model=List[FinancialImpact])
async def get_financial_impact(
    location_id: Optional[str] = Query(None, description="Filter by location ID")
):
    """Get financial impact analysis of dead zones."""
    location = None
    if location_id:
        location = analysis_service.get_location(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    return analysis_service.calculate_financial_impact(location)


@router.get("/charts/{chart_type}")
async def get_chart_data(
    chart_type: str,
    location_id: Optional[str] = Query(None, description="Filter by location ID")
):
    """
    Get chart data for visualizations.

    Available chart types:
    - utilization_by_hour: Hourly utilization patterns
    - wind_correlation: Utilization vs wind speed
    - revenue_impact: Revenue losses by location
    - booking_type_breakdown: Losses by booking type
    """
    valid_charts = ["utilization_by_hour", "wind_correlation", "revenue_impact", "booking_type_breakdown"]
    if chart_type not in valid_charts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid chart type. Valid options: {', '.join(valid_charts)}"
        )

    return analysis_service.get_chart_data(chart_type, location_id)
