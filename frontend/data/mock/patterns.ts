/**
 * Mock data for the Patterns screen charts.
 *
 * Each export mirrors the shape a real API endpoint would return,
 * making the eventual swap to live data a single-line change per chart.
 *
 * Values are calibrated for a public golf facility in the US Southeast
 * with ~150 tee-time slots/day across all booking types.
 */

// ---------------------------------------------------------------------------
// Wind Wall (mph → outdoor utilization %)
// ---------------------------------------------------------------------------
export const windUtilization = {
  speeds: [0, 5, 10, 15, 20, 25, 30, 35, 40],
  utilization: [86, 84, 79, 70, 54, 31, 16, 9, 5],
};

// ---------------------------------------------------------------------------
// Temperature Sweet Spot (°F band → outdoor utilization %)
// ---------------------------------------------------------------------------
export const temperatureUtilization = {
  bands: ['< 40', '40–49', '50–59', '60–69', '70–79', '80–89', '90–99', '100+'],
  utilization: [12, 34, 60, 88, 91, 72, 42, 19],
};

// ---------------------------------------------------------------------------
// Heat Index Penalty (feels-like °F → outdoor utilization %)
// Heat index accounts for humidity; drops faster than raw temp alone
// ---------------------------------------------------------------------------
export const heatIndexUtilization = {
  bands: ['< 80', '80–89', '90–99', '100–104', '105–109', '110+'],
  utilization: [85, 80, 68, 45, 24, 10],
};

// ---------------------------------------------------------------------------
// Precipitation Impact (bucket → outdoor utilization %)
// ---------------------------------------------------------------------------
export const precipUtilization = {
  buckets: ['None', 'Drizzle\n< 0.05"', 'Light\n0.05–0.2"', 'Moderate\n0.2–0.5"', 'Heavy\n0.5"+'],
  utilization: [84, 58, 34, 16, 5],
};

// ---------------------------------------------------------------------------
// Monthly Seasonality
// utilization % + avg revenue per booking slot ($)
// ---------------------------------------------------------------------------
export const monthSeasonality = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  utilization: [38, 44, 62, 78, 84, 76, 71, 69, 80, 82, 58, 40],
  avgRevenue: [42, 45, 55, 68, 72, 70, 67, 65, 71, 74, 55, 44],
};

// ---------------------------------------------------------------------------
// Day of Week Pattern
// utilization % + avg revenue per booking slot ($)
// ---------------------------------------------------------------------------
export const dayOfWeekPattern = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  utilization: [52, 48, 51, 55, 68, 88, 84],
  avgRevenue: [55, 52, 54, 57, 65, 78, 75],
};

// ---------------------------------------------------------------------------
// Hour × Day Heatmap
// Rows = days (Mon–Sun), Columns = hours (6AM–7PM)
// Each entry: [hourIndex, dayIndex, utilization %]
// ---------------------------------------------------------------------------
export const HEATMAP_HOURS = ['6AM','7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM'];
export const HEATMAP_DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// Raw matrix [day][hour] — index 0 = Mon, 0 = 6AM
const RAW: number[][] = [
  //  6AM  7AM  8AM  9AM 10AM 11AM 12PM  1PM  2PM  3PM  4PM  5PM  6PM  7PM
  [   14,  32,  62,  74,  80,  72,  52,  46,  54,  58,  48,  34,  18,   8 ], // Mon
  [   12,  30,  58,  72,  78,  70,  55,  48,  56,  60,  50,  36,  20,   9 ], // Tue
  [   15,  34,  64,  76,  82,  74,  58,  52,  60,  63,  53,  38,  22,  10 ], // Wed
  [   16,  36,  66,  78,  84,  76,  62,  56,  64,  67,  56,  42,  24,  11 ], // Thu
  [   18,  42,  72,  82,  86,  80,  68,  63,  70,  73,  64,  50,  32,  16 ], // Fri
  [   28,  58,  88,  92,  95,  90,  82,  78,  82,  85,  78,  65,  44,  24 ], // Sat
  [   26,  54,  84,  90,  92,  88,  78,  72,  76,  80,  72,  58,  38,  20 ], // Sun
];

export const hourDayHeatmap: [number, number, number][] = RAW.flatMap(
  (row, dayIdx) => row.map((val, hourIdx) => [hourIdx, dayIdx, val])
);
