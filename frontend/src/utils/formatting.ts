export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercent = (value: number, decimals = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatBookingType = (type: string): string => {
  const names: Record<string, string> = {
    NINE_HOLE: '9-Hole',
    EIGHTEEN_HOLE: '18-Hole',
    DRIVING_RANGE: 'Driving Range',
    INDOOR_DRIVING_RANGE: 'Indoor Range',
    OUTDOOR_PUTT_PUTT: 'Outdoor Putt-Putt',
    INDOOR_PUTT_PUTT: 'Indoor Putt-Putt',
  };
  return names[type] || type;
};

export const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

export const getWeatherColor = (condition: string): string => {
  const colors: Record<string, string> = {
    Perfect: '#22c55e',
    Fair: '#3b82f6',
    Rainy: '#6b7280',
    Windy: '#f59e0b',
    'Very Windy': '#ef4444',
    Cold: '#06b6d4',
    Hot: '#f97316',
  };
  return colors[condition] || '#6b7280';
};

export const getUtilizationColor = (rate: number): string => {
  if (rate >= 0.7) return '#22c55e'; // Green
  if (rate >= 0.4) return '#f59e0b'; // Amber
  if (rate >= 0.15) return '#ef4444'; // Red
  return '#7f1d1d'; // Dark red (dead zone)
};
