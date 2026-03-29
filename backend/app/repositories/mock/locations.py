from __future__ import annotations

from typing import Dict, List, Optional

from ...models.booking_type import BookingType
from ...models.reservation import Location
from ..base import LocationRepository


# Single source of truth for all facility locations.
# Imported by mock_data.py so there is no duplicate definition.
LOCATIONS: List[Location] = [
    Location(id="loc_001", name="Sunset Valley Golf Club",
             latitude=33.7490, longitude=-84.3880, city="Atlanta", state="GA",
             available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE,
                                      BookingType.DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT]),
    Location(id="loc_002", name="Pinehurst Family Golf",
             latitude=35.1954, longitude=-79.4695, city="Pinehurst", state="NC",
             available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE,
                                      BookingType.DRIVING_RANGE, BookingType.INDOOR_DRIVING_RANGE,
                                      BookingType.OUTDOOR_PUTT_PUTT, BookingType.INDOOR_PUTT_PUTT]),
    Location(id="loc_003", name="Desert Springs Golf Resort",
             latitude=33.8303, longitude=-116.5453, city="Palm Springs", state="CA",
             available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE,
                                      BookingType.DRIVING_RANGE]),
    Location(id="loc_004", name="Lakeside Country Club",
             latitude=41.8781, longitude=-87.6298, city="Chicago", state="IL",
             available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE,
                                      BookingType.DRIVING_RANGE, BookingType.INDOOR_DRIVING_RANGE]),
    Location(id="loc_005", name="Ocean Breeze Golf Links",
             latitude=26.1224, longitude=-80.1373, city="Fort Lauderdale", state="FL",
             available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE,
                                      BookingType.DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT]),
    Location(id="loc_006", name="Mountain View Golf Academy",
             latitude=39.7392, longitude=-104.9903, city="Denver", state="CO",
             available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE,
                                      BookingType.DRIVING_RANGE, BookingType.INDOOR_DRIVING_RANGE,
                                      BookingType.INDOOR_PUTT_PUTT]),
    Location(id="loc_007", name="Texas Star Golf Course",
             latitude=32.7767, longitude=-96.7970, city="Dallas", state="TX",
             available_booking_types=[BookingType.NINE_HOLE, BookingType.EIGHTEEN_HOLE,
                                      BookingType.DRIVING_RANGE, BookingType.OUTDOOR_PUTT_PUTT,
                                      BookingType.INDOOR_PUTT_PUTT]),
]


class MockLocationRepository(LocationRepository):
    def __init__(self) -> None:
        self._store: Dict[str, Location] = {loc.id: loc for loc in LOCATIONS}

    def get_by_id(self, location_id: str) -> Optional[Location]:
        return self._store.get(location_id)

    def list_all(self) -> List[Location]:
        return list(self._store.values())
