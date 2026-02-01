from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict
from .booking_type import BookingType


class Location(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    city: str
    state: str
    available_booking_types: List[BookingType]

    class Config:
        json_schema_extra = {
            "example": {
                "id": "loc_001",
                "name": "Sunset Valley Golf Club",
                "latitude": 33.7490,
                "longitude": -84.3880,
                "city": "Atlanta",
                "state": "GA",
                "available_booking_types": ["NINE_HOLE", "EIGHTEEN_HOLE", "DRIVING_RANGE"]
            }
        }


class Reservation(BaseModel):
    id: str
    location_id: str
    booking_type: BookingType
    timestamp: datetime
    party_size: int = Field(ge=1, le=8)
    price: float
    duration_minutes: int

    class Config:
        json_schema_extra = {
            "example": {
                "id": "res_001",
                "location_id": "loc_001",
                "booking_type": "EIGHTEEN_HOLE",
                "timestamp": "2024-07-15T09:30:00",
                "party_size": 4,
                "price": 260.0,
                "duration_minutes": 240
            }
        }


class HourlyUtilization(BaseModel):
    location_id: str
    booking_type: BookingType
    date: datetime
    hour: int = Field(ge=0, le=23)
    bookings_count: int
    capacity: int
    utilization_rate: float = Field(ge=0.0, le=1.0)
    revenue: float

    @property
    def is_dead_zone(self) -> bool:
        from ..config import settings
        return self.utilization_rate < settings.DEAD_ZONE_UTILIZATION_THRESHOLD


class DeadZone(BaseModel):
    location_id: str
    location_name: str
    booking_type: BookingType
    date: datetime
    hour: int
    utilization_rate: float
    potential_capacity: int
    lost_revenue: float
    weather_related: bool = False
    weather_condition: Optional[str] = None


class FinancialImpact(BaseModel):
    location_id: str
    location_name: str
    booking_type: BookingType
    total_dead_zone_hours: int
    total_lost_revenue: float
    weather_related_losses: float
    behavior_related_losses: float
    avg_utilization_during_dead_zones: float


class LocationSummary(BaseModel):
    location: Location
    total_reservations: int
    total_revenue: float
    avg_utilization: float
    dead_zone_count: int
    dead_zone_revenue_loss: float
