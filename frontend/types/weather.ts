// ---------------------------------------------------------------------------
// Weather condition enums
// ---------------------------------------------------------------------------

export type PrecipitationType =
  | 'none'
  | 'drizzle'
  | 'rain'
  | 'heavy_rain'
  | 'sleet'
  | 'snow'
  | 'hail';

export type SkyCondition =
  | 'clear'
  | 'mostly_clear'
  | 'partly_cloudy'
  | 'mostly_cloudy'
  | 'overcast';

export type WindDirection =
  | 'N' | 'NNE' | 'NE' | 'ENE'
  | 'E' | 'ESE' | 'SE' | 'SSE'
  | 'S' | 'SSW' | 'SW' | 'WSW'
  | 'W' | 'WNW' | 'NW' | 'NNW';

// ---------------------------------------------------------------------------
// Full weather reading (actual or forecast)
// ---------------------------------------------------------------------------

export interface WeatherReading {
  /** Internal UUID */
  id: string;

  locationId: string;

  /** ISO 8601 datetime this reading applies to */
  timestamp: string;

  /** True = forecast pulled before the fact; false = actual observed reading */
  isForecast: boolean;

  // --- Temperature ---
  /** Air temperature at 2m in °F */
  temperatureF: number;
  /** Feels-like / apparent temperature in °F */
  feelsLikeF: number;
  /** Dew point in °F (indicator of humidity/stickiness) */
  dewPointF: number;
  /** Relative humidity 0–100% */
  humidityPercent: number;

  // --- Wind ---
  /** Sustained wind speed in mph */
  windSpeedMph: number;
  /** Wind gust speed in mph */
  windGustMph: number;
  /** Compass direction the wind is coming FROM */
  windDirection: WindDirection;
  /** Wind direction in degrees (0 = N, 90 = E, 180 = S, 270 = W) */
  windDirectionDeg: number;

  // --- Precipitation ---
  /** Total precipitation in the hour in inches */
  precipitationInches: number;
  precipitationType: PrecipitationType;
  /** Probability of precipitation 0–100% (meaningful for forecasts) */
  precipitationProbabilityPercent: number;

  // --- Sky ---
  skyCondition: SkyCondition;
  /** Cloud cover 0–100% */
  cloudCoverPercent: number;
  /** Visibility in miles */
  visibilityMiles: number;

  // --- Solar ---
  /** UV index 0–11+ */
  uvIndex: number;
  /** Solar radiation in W/m² */
  solarRadiationWm2: number | null;

  // --- Pressure ---
  /** Barometric pressure in inHg */
  pressureInHg: number;

  // --- Derived / analysis fields ---
  /**
   * Composite playability score 0–100 calculated by the analysis engine.
   * Higher = better conditions for outdoor golf.
   * null if not yet scored.
   */
  playabilityScore: number | null;

  /** Data source, e.g. "open-meteo", "noaa", "manual" */
  source: string;
}

// ---------------------------------------------------------------------------
// Daily weather summary (aggregated from hourly readings)
// ---------------------------------------------------------------------------

export interface DailyWeatherSummary {
  locationId: string;
  /** ISO 8601 date, e.g. "2024-07-15" */
  date: string;

  highTempF: number;
  lowTempF: number;
  avgWindSpeedMph: number;
  maxWindGustMph: number;
  totalPrecipitationInches: number;
  dominantPrecipType: PrecipitationType;
  dominantSkyCondition: SkyCondition;
  avgHumidityPercent: number;
  maxUvIndex: number;

  /** Hours in the day where playabilityScore >= 70 */
  goodPlayingHours: number;
  /** Hours in the day where playabilityScore < 30 */
  poorPlayingHours: number;

  /** ISO 8601 datetimes */
  sunrise: string;
  sunset: string;
}
