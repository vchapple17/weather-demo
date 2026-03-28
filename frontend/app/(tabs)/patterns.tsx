import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, Dimensions } from 'react-native';
import * as echarts from 'echarts';
import { SVGRenderer, SvgChart } from '@wuba/react-native-echarts';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

echarts.use([SVGRenderer]);

const CHART_WIDTH = Dimensions.get('window').width - 40;
const CHART_HEIGHT = 260;

// Mock: wind speed (mph) vs average utilization rate (%)
const WIND_SPEEDS = [0, 5, 10, 15, 20, 25, 30, 35, 40];
const UTILIZATION =  [82, 80, 76, 68, 52, 31, 18, 10, 7];

export default function PatternsScreen() {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    let chart: echarts.ECharts | undefined;

    if (chartRef.current) {
      chart = echarts.init(chartRef.current, 'light', {
        renderer: 'svg',
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
      });

      chart.setOption({
        title: {
          text: 'Wind Wall Effect',
          subtext: '18-hole outdoor rounds',
          left: 'center',
          textStyle: { fontSize: 14, fontWeight: 'bold' },
          subtextStyle: { fontSize: 11 },
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const p = params[0];
            return `${p.axisValue} mph wind\n${p.data}% utilization`;
          },
        },
        grid: { top: 70, bottom: 40, left: 50, right: 20 },
        xAxis: {
          type: 'category',
          data: WIND_SPEEDS.map(s => `${s}`),
          name: 'Wind (mph)',
          nameLocation: 'middle',
          nameGap: 28,
          axisLabel: { fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          name: 'Utilization %',
          min: 0,
          max: 100,
          axisLabel: { fontSize: 11 },
        },
        series: [
          {
            data: UTILIZATION,
            type: 'line',
            smooth: true,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.15 },
            markLine: {
              silent: true,
              lineStyle: { color: '#e74c3c', type: 'dashed' },
              data: [{ xAxis: '25', label: { formatter: 'Wind wall', position: 'insideEndTop' } }],
            },
          },
        ],
      });
    }

    return () => chart?.dispose();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Patterns</ThemedText>
        <ThemedText>Weather correlations and behavioral trends</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <View ref={chartRef} style={{ width: CHART_WIDTH, height: CHART_HEIGHT }} />
      </ThemedView>

      <ThemedView style={styles.insight}>
        <ThemedText type="subtitle">Wind Wall at ~25 mph</ThemedText>
        <ThemedText>
          Outdoor round bookings drop sharply above 25 mph. Below that threshold, wind has minimal impact.
        </ThemedText>
      </ThemedView>
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
    overflow: 'hidden',
  },
  insight: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    opacity: 0.85,
  },
});
