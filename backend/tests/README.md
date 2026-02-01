# Backend Tests

## Running Tests

### With Docker (Recommended)

```bash
# Run all tests
docker exec weather-demo-backend-1 pytest tests/ -v

# Run with short output
docker exec weather-demo-backend-1 pytest tests/

# Run a specific test file
docker exec weather-demo-backend-1 pytest tests/test_revenue_examples.py -v

# Run a specific test class
docker exec weather-demo-backend-1 pytest tests/test_revenue_examples.py::TestWeatherImpact -v

# Run a specific test
docker exec weather-demo-backend-1 pytest tests/test_revenue_examples.py::TestWeatherImpact::test_indoor_unaffected_by_rain -v
```

### Locally (requires virtual environment)

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

## Test Structure

```
tests/
├── __init__.py
├── conftest.py          # Pytest fixtures (shared across all tests)
├── fixtures.py          # Hard-coded test data and factories
├── test_revenue_examples.py  # Example tests demonstrating fixture usage
└── README.md
```

## Fixtures

### Location Fixtures
- `test_location` - Standard outdoor golf club (Atlanta)
- `indoor_location` - Indoor-only facility (Chicago)
- `full_service_location` - All booking types available (Fort Lauderdale)

### Weather Fixtures
- `perfect_weather` - Ideal conditions (70°F, 5mph wind, no rain)
- `rainy_weather` - Heavy rain scenario
- `high_wind_weather` - 25mph wind (triggers "wind wall" effect)
- `extreme_heat_weather` - 102°F
- `cold_weather` - 42°F

### Data Fixtures
- `normal_day_reservations` - Typical weekday booking pattern
- `peak_day_reservations` - Sold-out Saturday
- `dead_day_reservations` - Bad weather, minimal bookings
- `week_utilization` - 7 days of hourly utilization data

### Factory Fixtures
- `reservation_factory` - Create custom reservations
- `utilization_factory` - Create custom utilization records
- `weather_factory` - Create custom weather conditions

### Parametrized Fixtures
- `any_booking_type` - Runs test for each BookingType enum value
- `outdoor_booking_type` - Runs test for outdoor types only
- `indoor_booking_type` - Runs test for indoor types only
- `any_weather` - Runs test for each weather condition

## Writing Tests

### Using Hard-Coded Fixtures

```python
def test_peak_exceeds_normal(self, normal_day_reservations, peak_day_reservations):
    assert len(peak_day_reservations) > len(normal_day_reservations)
```

### Using Factory Fixtures

```python
def test_early_bird_reservation(self, reservation_factory):
    early_bird = reservation_factory(
        timestamp=datetime(2024, 7, 15, 6, 0),
        party_size=2,
    )
    assert early_bird.timestamp.hour == 6
```

### Using Parametrized Fixtures

```python
def test_pricing_defined(self, any_booking_type):
    """This test runs once for each booking type."""
    assert any_booking_type.value in settings.PRICING
```

### Using Dynamic Generator with Seeds

```python
@pytest.mark.parametrize("seed", [1, 42, 100, 999])
def test_revenue_never_negative(self, seed, test_location):
    gen = MockDataGenerator(seed=seed)
    # ... deterministic but varied test data
```

## Useful pytest Options

```bash
# Show print statements
pytest tests/ -v -s

# Stop on first failure
pytest tests/ -v -x

# Run only failed tests from last run
pytest tests/ -v --lf

# Run tests matching a pattern
pytest tests/ -v -k "weather"

# Show test durations
pytest tests/ -v --durations=10
```
