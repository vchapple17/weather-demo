import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { ChartData } from '../../api/client';

interface Props {
  data: ChartData;
  title?: string;
}

const screenWidth = Dimensions.get('window').width;

export const UtilizationChart: React.FC<Props> = ({ data, title }) => {
  const chartData = {
    labels: data.labels.filter((_, i) => i % 2 === 0), // Show every other label
    datasets: [
      {
        data: data.datasets[0]?.data || [],
      },
    ],
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <BarChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        yAxisSuffix="%"
        yAxisLabel=""
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(26, 71, 42, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.6,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
      />
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
});
