import { Platform } from 'react-native';

// Use localhost for web, 10.0.2.2 for Android emulator, actual IP for physical devices
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  // iOS simulator and physical devices - use your machine's local IP
  return 'http://localhost:8000';
};

const BASE_URL = getBaseUrl();

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  available_booking_types: string[];
}

export interface DeadZone {
  location_id: string;
  location_name: string;
  booking_type: string;
  date: string;
  hour: number;
  utilization_rate: number;
  potential_capacity: number;
  lost_revenue: number;
  weather_related: boolean;
  weather_condition: string | null;
}

export interface WeatherCorrelation {
  booking_type: string;
  weather_condition: string;
  avg_utilization: number;
  sample_count: number;
  baseline_utilization: number;
  utilization_impact: number;
}

export interface WindThreshold {
  booking_type: string;
  wind_wall_mph: number;
  utilization_below_threshold: number;
  utilization_above_threshold: number;
  confidence_score: number;
}

export interface FinancialImpact {
  location_id: string;
  location_name: string;
  booking_type: string;
  total_dead_zone_hours: number;
  total_lost_revenue: number;
  weather_related_losses: number;
  behavior_related_losses: number;
  avg_utilization_during_dead_zones: number;
}

export interface LocationSummary {
  location: Location;
  total_reservations: number;
  total_revenue: number;
  avg_utilization: number;
  dead_zone_count: number;
  dead_zone_revenue_loss: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface ReportSummary {
  total_lost_revenue: number;
  weather_related_losses: number;
  behavior_related_losses: number;
  total_dead_zone_hours: number;
  wind_wall_mph: number | null;
  top_revenue_leaks: {
    location: string;
    booking_type: string;
    lost_revenue: number;
    dead_zone_hours: number;
  }[];
}

export interface StructuredReport {
  generated_at: string;
  analysis_period: string;
  location_name: string | null;
  executive_summary: {
    total_lost_revenue: number;
    weather_related_losses: number;
    weather_related_percent: number;
    behavior_related_losses: number;
    behavior_related_percent: number;
    top_revenue_leaks: {
      location: string;
      booking_type: string;
      booking_type_display: string;
      lost_revenue: number;
      dead_zone_hours: number;
      primary_cause: string;
    }[];
    wind_wall_mph: number | null;
    wind_wall_utilization_drop: string | null;
  };
  wind_wall: {
    entries: {
      booking_type: string;
      wind_threshold_mph: number;
      utilization_below: number;
      utilization_above: number;
      drop_percent: number;
    }[];
    interpretation: string[];
  };
  weather_correlation: {
    negative_impacts: {
      booking_type: string;
      weather_condition: string;
      avg_utilization: number;
      impact_vs_baseline: number;
    }[];
    positive_impacts: {
      booking_type: string;
      weather_condition: string;
      avg_utilization: number;
      impact_vs_baseline: number;
    }[];
    key_findings: string[];
  };
  dead_zones: {
    total_dead_zone_hours: number;
    weather_related_count: number;
    weather_related_percent: number;
    behavior_related_count: number;
    peak_dead_hours: { hour: number; occurrences: number }[];
    patterns: string[];
  };
  financial_impact: {
    by_booking_type: { booking_type: string; lost_revenue: number }[];
    by_location: { location: string; lost_revenue: number }[];
  };
  recommendations: {
    title: string;
    trigger: string | null;
    actions: string[];
    estimated_recovery: string | null;
  }[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchText(endpoint: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return this.fetch<Location[]>('/api/locations');
  }

  async getLocation(id: string): Promise<Location> {
    return this.fetch<Location>(`/api/locations/${id}`);
  }

  async getLocationSummary(id: string): Promise<LocationSummary> {
    return this.fetch<LocationSummary>(`/api/locations/${id}/summary`);
  }

  // Analysis
  async getDeadZones(locationId?: string, limit = 100): Promise<DeadZone[]> {
    const params = new URLSearchParams();
    if (locationId) params.append('location_id', locationId);
    params.append('limit', limit.toString());
    return this.fetch<DeadZone[]>(`/api/analysis/dead-zones?${params}`);
  }

  async getWeatherCorrelation(locationId?: string): Promise<WeatherCorrelation[]> {
    const params = locationId ? `?location_id=${locationId}` : '';
    return this.fetch<WeatherCorrelation[]>(`/api/analysis/weather-correlation${params}`);
  }

  async getWindThreshold(locationId?: string): Promise<WindThreshold[]> {
    const params = locationId ? `?location_id=${locationId}` : '';
    return this.fetch<WindThreshold[]>(`/api/analysis/wind-threshold${params}`);
  }

  async getBehaviorDeadZones(locationId?: string, limit = 100): Promise<DeadZone[]> {
    const params = new URLSearchParams();
    if (locationId) params.append('location_id', locationId);
    params.append('limit', limit.toString());
    return this.fetch<DeadZone[]>(`/api/analysis/behavior-dead-zones?${params}`);
  }

  async getFinancialImpact(locationId?: string): Promise<FinancialImpact[]> {
    const params = locationId ? `?location_id=${locationId}` : '';
    return this.fetch<FinancialImpact[]>(`/api/analysis/financial-impact${params}`);
  }

  // Charts
  async getChartData(chartType: string, locationId?: string): Promise<ChartData> {
    const params = locationId ? `?location_id=${locationId}` : '';
    return this.fetch<ChartData>(`/api/charts/${chartType}${params}`);
  }

  // Reports
  async getReport(locationId?: string): Promise<string> {
    const params = locationId ? `?location_id=${locationId}` : '';
    return this.fetchText(`/api/report${params}`);
  }

  async getReportSummary(locationId?: string): Promise<ReportSummary> {
    const params = locationId ? `?location_id=${locationId}` : '';
    return this.fetch<ReportSummary>(`/api/report/summary${params}`);
  }

  async getStructuredReport(locationId?: string): Promise<StructuredReport> {
    const params = locationId ? `?location_id=${locationId}` : '';
    return this.fetch<StructuredReport>(`/api/report/structured${params}`);
  }
}

export const apiClient = new ApiClient(BASE_URL);
