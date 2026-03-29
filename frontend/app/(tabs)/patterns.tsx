import { ScrollView, StyleSheet } from 'react-native';
import type * as echarts from 'echarts';

import { EChart } from '@/components/charts/EChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  dayOfWeekPattern,
  HEATMAP_DAYS,
  HEATMAP_HOURS,
  heatIndexUtilization,
  hourDayHeatmap,
  monthSeasonality,
  precipUtilization,
  temperatureUtilization,
  windUtilization,
} from '@/data/mock/patterns';

// ---------------------------------------------------------------------------
// Shared chart defaults
// ---------------------------------------------------------------------------

const TINT = '#0a7ea4';
const MUTED = '#687076';

const baseGrid = { top: 56, bottom: 44, left: 50, right: 16 };
const baseXAxis = (data: string[]): echarts.XAXisComponentOption => ({
  type: 'category',
  data,
  axisLabel: { fontSize: 10, color: MUTED },
  axisLine: { lineStyle: { color: '#e0e0e0' } },
  axisTick: { show: false },
});
const baseYAxis = (name: string): echarts.YAXisComponentOption => ({
  type: 'value',
  name,
  nameTextStyle: { fontSize: 10, color: MUTED },
  min: 0,
  max: 100,
  axisLabel: { fontSize: 10, color: MUTED, formatter: '{value}%' },
  splitLine: { lineStyle: { color: '#f0f0f0' } },
});
const baseTooltip = (suffix = '%'): echarts.TooltipComponentOption => ({
  trigger: 'axis',
  formatter: (params: any) => `${params[0].axisValue}: ${params[0].data}${suffix}`,
});

// Color a bar based on utilization value: green → amber → red
function utilizationColor(value: number): string {
  if (value >= 70) return '#27ae60';
  if (value >= 40) return '#f39c12';
  return '#e74c3c';
}

function utilizationColors(values: number[]): string[] {
  return values.map(utilizationColor);
}

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------

interface ChartConfig {
  id: string;
  title: string;
  insight: string;
  option: echarts.EChartsOption;
  height?: number;
}

const CHARTS: ChartConfig[] = [
  // 1. Wind Wall
  {
    id: 'wind',
    title: 'Wind Wall Effect',
    insight: 'Bookings drop sharply past 25 mph — a hard threshold worth monitoring in real time.',
    option: {
      grid: baseGrid,
      tooltip: baseTooltip(),
      xAxis: { ...baseXAxis(windUtilization.speeds.map(s => `${s}`)), name: 'Wind (mph)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 10, color: MUTED } },
      yAxis: baseYAxis('Utilization'),
      series: [{
        data: windUtilization.utilization,
        type: 'line',
        smooth: true,
        lineStyle: { color: TINT, width: 2 },
        areaStyle: { color: TINT, opacity: 0.12 },
        itemStyle: { color: TINT },
        markLine: {
          silent: true,
          lineStyle: { color: '#e74c3c', type: 'dashed' },
          data: [{ xAxis: '25', label: { formatter: 'Wind wall', position: 'insideEndTop', fontSize: 10 } }],
        },
      }],
    },
  },

  // 2. Temperature Sweet Spot
  {
    id: 'temperature',
    title: 'Temperature Sweet Spot',
    insight: 'Peak utilization sits in the 70–79°F band. Extreme heat kills rounds as fast as cold.',
    option: {
      grid: baseGrid,
      tooltip: baseTooltip(),
      xAxis: { ...baseXAxis(temperatureUtilization.bands), name: 'Temp (°F)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 10, color: MUTED } },
      yAxis: baseYAxis('Utilization'),
      series: [{
        data: temperatureUtilization.utilization.map((v, i) => ({
          value: v,
          itemStyle: { color: utilizationColor(v) },
        })),
        type: 'bar',
        barMaxWidth: 32,
      }],
    },
  },

  // 3. Heat Index Penalty
  {
    id: 'heat-index',
    title: 'Heat Index Penalty',
    insight: 'Above 105°F feels-like, utilization collapses faster than dry temperature alone predicts.',
    option: {
      grid: { ...baseGrid, left: 80 },
      tooltip: baseTooltip(),
      xAxis: { ...baseYAxis('Utilization'), type: 'value', name: 'Utilization %', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 10, color: MUTED }, axisLabel: { formatter: '{value}%', fontSize: 10, color: MUTED } },
      yAxis: { type: 'category', data: heatIndexUtilization.bands, axisLabel: { fontSize: 10, color: MUTED }, axisTick: { show: false } },
      series: [{
        data: heatIndexUtilization.utilization.map((v) => ({
          value: v,
          itemStyle: { color: utilizationColor(v) },
        })),
        type: 'bar',
        barMaxWidth: 28,
      }],
    },
  },

  // 4. Precipitation Impact
  {
    id: 'precip',
    title: 'Precipitation Impact',
    insight: 'Even drizzle cuts utilization by ~30%. Any measurable rain drops it below 40%.',
    option: {
      grid: { ...baseGrid, bottom: 56 },
      tooltip: baseTooltip(),
      xAxis: { ...baseXAxis(precipUtilization.buckets) },
      yAxis: baseYAxis('Utilization'),
      series: [{
        data: precipUtilization.utilization.map((v) => ({
          value: v,
          itemStyle: { color: utilizationColor(v) },
        })),
        type: 'bar',
        barMaxWidth: 40,
      }],
    },
  },

  // 5. Monthly Seasonality
  {
    id: 'monthly',
    title: 'Monthly Seasonality',
    insight: 'Spring (Apr–May) and fall (Sep–Oct) peak together. January and December are the dead months.',
    height: 260,
    option: {
      grid: { ...baseGrid, right: 50 },
      tooltip: { trigger: 'axis' },
      legend: { top: 4, textStyle: { fontSize: 10 }, itemWidth: 12, itemHeight: 8 },
      xAxis: baseXAxis(monthSeasonality.months),
      yAxis: [
        { ...baseYAxis('Utilization'), position: 'left' },
        { type: 'value', name: 'Avg $', min: 0, max: 100, position: 'right', axisLabel: { fontSize: 10, color: MUTED, formatter: '${value}' }, splitLine: { show: false } },
      ],
      series: [
        {
          name: 'Utilization %',
          data: monthSeasonality.utilization,
          type: 'bar',
          barMaxWidth: 18,
          itemStyle: { color: TINT, opacity: 0.8 },
          yAxisIndex: 0,
        },
        {
          name: 'Avg Revenue',
          data: monthSeasonality.avgRevenue,
          type: 'line',
          smooth: true,
          lineStyle: { color: '#e67e22', width: 2 },
          itemStyle: { color: '#e67e22' },
          symbol: 'circle',
          symbolSize: 5,
          yAxisIndex: 1,
        },
      ],
    },
  },

  // 6. Day of Week Pattern
  {
    id: 'day-of-week',
    title: 'Day of Week Pattern',
    insight: 'Tue–Thu are the biggest dead-zone opportunity — lowest utilization, highest untapped capacity.',
    option: {
      grid: { ...baseGrid, right: 50 },
      tooltip: { trigger: 'axis' },
      legend: { top: 4, textStyle: { fontSize: 10 }, itemWidth: 12, itemHeight: 8 },
      xAxis: baseXAxis(dayOfWeekPattern.days),
      yAxis: [
        { ...baseYAxis('Utilization'), position: 'left' },
        { type: 'value', name: 'Avg $', min: 0, max: 100, position: 'right', axisLabel: { fontSize: 10, color: MUTED, formatter: '${value}' }, splitLine: { show: false } },
      ],
      series: [
        {
          name: 'Utilization %',
          data: dayOfWeekPattern.utilization.map((v) => ({ value: v, itemStyle: { color: utilizationColor(v) } })),
          type: 'bar',
          barMaxWidth: 32,
          yAxisIndex: 0,
        },
        {
          name: 'Avg Revenue',
          data: dayOfWeekPattern.avgRevenue,
          type: 'line',
          smooth: true,
          lineStyle: { color: '#e67e22', width: 2 },
          itemStyle: { color: '#e67e22' },
          symbol: 'circle',
          symbolSize: 5,
          yAxisIndex: 1,
        },
      ],
    },
  },

  // 7. Hour × Day Heatmap
  {
    id: 'hour-day-heatmap',
    title: 'Utilization by Hour & Day',
    insight: 'Sat/Sun mornings are the hottest slots. Tue–Thu afternoons are the coldest — prime discount windows.',
    height: 300,
    option: {
      grid: { top: 24, bottom: 48, left: 44, right: 16 },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${HEATMAP_DAYS[params.data[1]]} ${HEATMAP_HOURS[params.data[0]]}: ${params.data[2]}%`,
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        itemWidth: 10,
        itemHeight: 80,
        text: ['High', 'Low'],
        textStyle: { fontSize: 10, color: MUTED },
        inRange: { color: ['#e74c3c', '#f39c12', '#27ae60'] },
      },
      xAxis: {
        type: 'category',
        data: HEATMAP_HOURS,
        axisLabel: { fontSize: 9, color: MUTED, rotate: 35 },
        axisTick: { show: false },
        splitArea: { show: true },
      },
      yAxis: {
        type: 'category',
        data: HEATMAP_DAYS,
        axisLabel: { fontSize: 10, color: MUTED },
        axisTick: { show: false },
        splitArea: { show: true },
      },
      series: [{
        type: 'heatmap',
        data: hourDayHeatmap,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.3)' } },
      }],
    },
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PatternsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Patterns</ThemedText>
        <ThemedText>Weather correlations and behavioral trends</ThemedText>
      </ThemedView>

      {CHARTS.map((cfg) => (
        <ThemedView key={cfg.id} style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>{cfg.title}</ThemedText>
          <EChart option={cfg.option} height={cfg.height} />
          <ThemedText style={styles.insight}>{cfg.insight}</ThemedText>
        </ThemedView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    gap: 24,
  },
  header: {
    gap: 6,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    marginBottom: 4,
  },
  insight: {
    fontSize: 13,
    opacity: 0.65,
  },
});
