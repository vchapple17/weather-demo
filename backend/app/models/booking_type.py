from enum import Enum


class BookingType(str, Enum):
    NINE_HOLE = "NINE_HOLE"
    EIGHTEEN_HOLE = "EIGHTEEN_HOLE"
    DRIVING_RANGE = "DRIVING_RANGE"
    INDOOR_DRIVING_RANGE = "INDOOR_DRIVING_RANGE"
    OUTDOOR_PUTT_PUTT = "OUTDOOR_PUTT_PUTT"
    INDOOR_PUTT_PUTT = "INDOOR_PUTT_PUTT"

    @property
    def is_indoor(self) -> bool:
        return self in (BookingType.INDOOR_DRIVING_RANGE, BookingType.INDOOR_PUTT_PUTT)

    @property
    def is_outdoor(self) -> bool:
        return not self.is_indoor

    @property
    def display_name(self) -> str:
        names = {
            BookingType.NINE_HOLE: "9-Hole Round",
            BookingType.EIGHTEEN_HOLE: "18-Hole Round",
            BookingType.DRIVING_RANGE: "Driving Range",
            BookingType.INDOOR_DRIVING_RANGE: "Indoor Driving Range",
            BookingType.OUTDOOR_PUTT_PUTT: "Outdoor Putt-Putt",
            BookingType.INDOOR_PUTT_PUTT: "Indoor Putt-Putt",
        }
        return names.get(self, self.value)
