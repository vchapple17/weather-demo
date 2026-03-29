from __future__ import annotations

from datetime import date, time
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class BookingStatus(str, Enum):
    PENDING = "PENDING"           # awaiting payment confirmation
    CONFIRMED = "CONFIRMED"       # payment received, tee time held
    CHECKED_IN = "CHECKED_IN"     # party arrived at the pro shop
    COMPLETED = "COMPLETED"       # round / activity finished
    NO_SHOW = "NO_SHOW"           # party never arrived
    CANCELLED = "CANCELLED"       # cancelled by guest or facility


class BookingSource(str, Enum):
    ONLINE = "ONLINE"             # booked via website or app
    PHONE = "PHONE"               # called the pro shop
    WALK_IN = "WALK_IN"           # in-person at facility
    THIRD_PARTY = "THIRD_PARTY"   # GolfNow, TeeOff, etc.


class CartOption(str, Enum):
    WALKING = "WALKING"           # no cart, player walks
    PULL_CART = "PULL_CART"       # manual pull/push cart
    SINGLE_CART = "SINGLE_CART"   # one motorized cart (fits 2)
    DOUBLE_CART = "DOUBLE_CART"   # two motorized carts (for 3-4 players)


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class Player(BaseModel):
    first_name: str
    last_name: str
    # USGA handicap index; None if not provided
    handicap_index: Optional[float] = Field(default=None, ge=-10.0, le=54.0)
    # Loyalty / membership ID if the player holds a membership
    member_id: Optional[str] = None


class CartSelection(BaseModel):
    option: CartOption
    # Number of motorized carts rented (0 for WALKING / PULL_CART)
    motorized_count: int = Field(default=0, ge=0, le=4)
    # Fee charged per motorized cart
    fee_per_cart: float = Field(default=0.0, ge=0.0)

    @property
    def total_cart_fee(self) -> float:
        return self.motorized_count * self.fee_per_cart


class BookingPricing(BaseModel):
    # Green fee / range fee / activity fee per player (before discounts)
    base_rate_per_player: float = Field(ge=0.0)
    cart: CartSelection
    # Member discount as a fraction (0.0 – 1.0)
    member_discount_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    # Dollar-value promotional or coupon discount
    promo_discount_amount: float = Field(default=0.0, ge=0.0)
    # Tax rate as a fraction (0.0 – 1.0)
    tax_rate: float = Field(default=0.07, ge=0.0, le=1.0)
    # Final amount charged after all discounts and tax
    total_charged: float = Field(ge=0.0)


class ContactInfo(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str  # stored as-provided (no normalization required for mock)


class WeatherSnapshot(BaseModel):
    """Lightweight weather summary embedded on a completed booking."""
    temperature_f: float
    wind_speed_mph: float
    precipitation_inches: float
    condition_summary: str  # e.g. "Partly Cloudy", "Rainy", "Perfect"


# ---------------------------------------------------------------------------
# Core Booking model
# ---------------------------------------------------------------------------

class Booking(BaseModel):
    # Primary key
    id: str
    # Human-readable confirmation shown to guest, e.g. "GC-20240715-4821"
    confirmation_number: str

    location_id: str
    booking_type: str           # references BookingType enum value
    status: BookingStatus
    source: BookingSource

    # When the activity is scheduled
    scheduled_date: date
    tee_time: time              # e.g. time(8, 30) → 08:30
    estimated_duration_minutes: int = Field(ge=15)

    # Party details
    party_size: int = Field(ge=1, le=8)
    players: list[Player]

    # Primary contact (lead booker; may or may not be a player)
    contact: ContactInfo

    pricing: BookingPricing

    # Audit timestamps (ISO 8601 strings to stay JSON-serialisable)
    created_at: str
    updated_at: str

    notes: Optional[str] = None

    # Populated retroactively for COMPLETED bookings
    weather_at_tee_time: Optional[WeatherSnapshot] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "bkg_001",
                "confirmation_number": "GC-20240715-4821",
                "location_id": "loc_001",
                "booking_type": "EIGHTEEN_HOLE",
                "status": "CONFIRMED",
                "source": "ONLINE",
                "scheduled_date": "2024-07-15",
                "tee_time": "08:30:00",
                "estimated_duration_minutes": 240,
                "party_size": 2,
                "players": [
                    {"first_name": "Jane", "last_name": "Doe", "handicap_index": 12.4, "member_id": None},
                    {"first_name": "John", "last_name": "Doe", "handicap_index": 18.1, "member_id": None},
                ],
                "contact": {
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "email": "jane.doe@example.com",
                    "phone": "555-867-5309",
                },
                "pricing": {
                    "base_rate_per_player": 65.0,
                    "cart": {"option": "SINGLE_CART", "motorized_count": 1, "fee_per_cart": 20.0},
                    "member_discount_rate": 0.0,
                    "promo_discount_amount": 0.0,
                    "tax_rate": 0.07,
                    "total_charged": 161.30,
                },
                "created_at": "2024-07-10T14:22:00Z",
                "updated_at": "2024-07-10T14:22:00Z",
                "notes": None,
                "weather_at_tee_time": None,
            }
        }
