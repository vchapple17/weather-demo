import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { StackedBarChart } from 'react-native-chart-kit';
import { ChartData } from '../../api/client';
import { formatCurrency } from '../../utils/formatting';

interface Props {
  data: ChartData;
  title?: string;
}

const screenWidth = Dimensions.get('window').width;

export const RevenueImpactChart: React.FC<Props> = ({ data, title }) => {
  // Transform data for stacked bar chart
  const chartData = {
    labels: data.labels.map(l => l.split(' ')[0].substring(0, 8)), // Truncate long names
    legend: data.datasets.map(d => d.label.replace(' Losses', '')),
    data: data.labels.map((_, i) =>
      data.datasets.map(d => d.data[i] || 0)
    ),
    barColors: ['#ef4444', '#f59e0b'],
  };

  const totalLoss = data.datasets.reduce((sum, d) =>
    sum + d.data.reduce((s, v) => s + v, 0), 0
  );

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <StackedBarChart
        data={chartData}
        width={screenWidth - 40}
        height={250}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={styles.chart}
        hideLegend={false}
      />
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Lost Revenue:</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalLoss)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1f2937',
  },
  chart: {
    borderRadius: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
  },
});
