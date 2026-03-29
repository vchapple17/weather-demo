from __future__ import annotations

import random
from datetime import date, datetime, time, timedelta
from typing import Dict, List, Optional

from ...models.booking import (
    Booking, BookingPricing, BookingSource, BookingStatus,
    CartOption, CartSelection, ContactInfo, Player, WeatherSnapshot,
)
from ...models.booking_type import BookingType
from ..base import BookingRepository

_FIRST_NAMES = ["James", "Maria", "David", "Linda", "Robert", "Patricia",
                 "Michael", "Barbara", "William", "Susan", "Carlos", "Jennifer"]
_LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
               "Miller", "Davis", "Wilson", "Martinez", "Anderson", "Taylor"]

_BASE_RATES: Dict[str, float] = {
    BookingType.NINE_HOLE: 35.0,
    BookingType.EIGHTEEN_HOLE: 65.0,
    BookingType.DRIVING_RANGE: 15.0,
    BookingType.INDOOR_DRIVING_RANGE: 25.0,
    BookingType.OUTDOOR_PUTT_PUTT: 12.0,
    BookingType.INDOOR_PUTT_PUTT: 15.0,
}

_DURATIONS: Dict[str, int] = {
    BookingType.NINE_HOLE: 120,
    BookingType.EIGHTEEN_HOLE: 240,
    BookingType.DRIVING_RANGE: 60,
    BookingType.INDOOR_DRIVING_RANGE: 60,
    BookingType.OUTDOOR_PUTT_PUTT: 45,
    BookingType.INDOOR_PUTT_PUTT: 45,
}

_TEE_TIMES = [time(h, m) for h in range(7, 19) for m in (0, 10, 20, 30, 40, 50)]

_LOCATION_TYPES: Dict[str, List[BookingType]] = {
    "loc_001": [BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT],
    "loc_002": [BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE,
                BookingType.INDOOR_DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT, BookingType.INDOOR_PUTT_PUTT],
    "loc_003": [BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE],
    "loc_004": [BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE, BookingType.INDOOR_DRIVING_RANGE],
    "loc_005": [BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT],
    "loc_006": [BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE,
                BookingType.INDOOR_DRIVING_RANGE, BookingType.INDOOR_PUTT_PUTT],
    "loc_007": [BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE, BookingType.DRIVING_RANGE,
                BookingType.OUTDOOR_PUTT_PUTT, BookingType.INDOOR_PUTT_PUTT],
}


def _make_player(rng: random.Random, member: bool = False) -> Player:
    return Player(
        first_name=rng.choice(_FIRST_NAMES),
        last_name=rng.choice(_LAST_NAMES),
        handicap_index=round(rng.uniform(0, 36), 1) if rng.random() > 0.3 else None,
        member_id=f"MBR-{rng.randint(1000, 9999)}" if member else None,
    )


def _make_pricing(rng: random.Random, booking_type: str, party_size: int, is_member: bool) -> BookingPricing:
    base = _BASE_RATES.get(booking_type, 20.0)
    is_round = booking_type in (BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE)

    if is_round and party_size >= 2:
        cart_option = rng.choice([CartOption.SINGLE_CART, CartOption.DOUBLE_CART, CartOption.WALKING])
    else:
        cart_option = CartOption.WALKING

    motorized, cart_fee = 0, 0.0
    if cart_option == CartOption.SINGLE_CART:
        motorized, cart_fee = 1, 20.0
    elif cart_option == CartOption.DOUBLE_CART:
        motorized, cart_fee = 2, 20.0

    member_discount = 0.15 if is_member else 0.0
    promo = rng.choice([0.0, 0.0, 0.0, 5.0, 10.0])
    tax_rate = 0.07
    subtotal = max(0.0, base * party_size * (1 - member_discount) + motorized * cart_fee - promo)
    total = round(subtotal * (1 + tax_rate), 2)

    return BookingPricing(
        base_rate_per_player=base,
        cart=CartSelection(option=cart_option, motorized_count=motorized, fee_per_cart=cart_fee),
        member_discount_rate=member_discount,
        promo_discount_amount=promo,
        tax_rate=tax_rate,
        total_charged=total,
    )


def _generate_seed(seed: int = 42) -> Dict[str, Booking]:
    rng = random.Random(seed)
    store: Dict[str, Booking] = {}
    base_date = date(2024, 4, 1)
    booking_idx = 1

    for day_offset in range(90):
        d = base_date + timedelta(days=day_offset)
        for loc_id, types in _LOCATION_TYPES.items():
            for _ in range(rng.randint(4, 14)):
                btype = rng.choice(types)
                party = rng.randint(1, 4)
                is_member = rng.random() < 0.2
                players = [_make_player(rng, member=(i == 0 and is_member)) for i in range(party)]
                lead = players[0]
                tee = rng.choice(_TEE_TIMES)
                status = rng.choices(
                    [BookingStatus.COMPLETED, BookingStatus.CONFIRMED, BookingStatus.NO_SHOW, BookingStatus.CANCELLED],
                    weights=[70, 20, 5, 5],
                )[0]

                weather_snap: Optional[WeatherSnapshot] = None
                if status == BookingStatus.COMPLETED:
                    temp = rng.uniform(45, 95)
                    wind = rng.uniform(0, 35)
                    precip = rng.choices([0.0, rng.uniform(0.01, 0.5)], weights=[75, 25])[0]
                    weather_snap = WeatherSnapshot(
                        temperature_f=round(temp, 1),
                        wind_speed_mph=round(wind, 1),
                        precipitation_inches=round(precip, 2),
                        condition_summary="Rainy" if precip > 0.1 else
                                         "Very Windy" if wind > 25 else
                                         "Perfect" if 60 <= temp <= 75 and wind <= 10 else "Fair",
                    )

                created_dt = datetime(d.year, d.month, d.day) - timedelta(days=rng.randint(1, 14))
                bkg_id = f"bkg_{booking_idx:05d}"

                store[bkg_id] = Booking(
                    id=bkg_id,
                    confirmation_number=f"GC-{d.strftime('%Y%m%d')}-{booking_idx:04d}",
                    location_id=loc_id,
                    booking_type=btype.value,
                    status=status,
                    source=rng.choice(list(BookingSource)),
                    scheduled_date=d,
                    tee_time=tee,
                    estimated_duration_minutes=_DURATIONS.get(btype, 60),
                    party_size=party,
                    players=players,
                    contact=ContactInfo(
                        first_name=lead.first_name,
                        last_name=lead.last_name,
                        email=f"{lead.first_name.lower()}.{lead.last_name.lower()}@example.com",
                        phone=f"555-{rng.randint(100,999)}-{rng.randint(1000,9999)}",
                    ),
                    pricing=_make_pricing(rng, btype.value, party, is_member),
                    created_at=created_dt.isoformat() + "Z",
                    updated_at=created_dt.isoformat() + "Z",
                    notes=None,
                    weather_at_tee_time=weather_snap,
                )
                booking_idx += 1

    return store


class MockBookingRepository(BookingRepository):
    def __init__(self, seed: int = 42) -> None:
        self._store: Dict[str, Booking] = _generate_seed(seed)

    def get_by_id(self, booking_id: str) -> Optional[Booking]:
        return self._store.get(booking_id)

    def get_by_confirmation(self, confirmation_number: str) -> Optional[Booking]:
        return next((b for b in self._store.values() if b.confirmation_number == confirmation_number), None)

    def list_by_location_and_date(self, location_id: str, scheduled_date: date) -> List[Booking]:
        return [b for b in self._store.values()
                if b.location_id == location_id and b.scheduled_date == scheduled_date]

    def list_by_date_range(self, location_id: str, start: date, end: date) -> List[Booking]:
        return [b for b in self._store.values()
                if b.location_id == location_id and start <= b.scheduled_date <= end]

    def create(self, booking: Booking) -> Booking:
        self._store[booking.id] = booking
        return booking

    def update_status(self, booking_id: str, status: BookingStatus) -> Optional[Booking]:
        booking = self._store.get(booking_id)
        if not booking:
            return None
        updated = booking.model_copy(update={
            "status": status,
            "updated_at": datetime.utcnow().isoformat() + "Z",
        })
        self._store[booking_id] = updated
        return updated
