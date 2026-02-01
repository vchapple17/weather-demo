import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient, ChartData, WeatherCorrelation } from '../api/client';
import { UtilizationChart } from '../components/charts/UtilizationChart';
import { WindCorrelationChart } from '../components/charts/WindCorrelationChart';
import { RevenueImpactChart } from '../components/charts/RevenueImpactChart';
import { formatPercent } from '../utils/formatting';

type ChartType = 'utilization' | 'wind' | 'revenue';

export const AnalysisScreen: React.FC = () => {
  const [activeChart, setActiveChart] = useState<ChartType>('utilization');
  const [utilizationData, setUtilizationData] = useState<ChartData | null>(null);
  const [windData, setWindData] = useState<ChartData | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData | null>(null);
  const [correlations, setCorrelations] = useState<WeatherCorrelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [util, wind, revenue, corr] = await Promise.all([
        apiClient.getChartData('utilization_by_hour'),
        apiClient.getChartData('wind_correlation'),
        apiClient.getChartData('revenue_impact'),
        apiClient.getWeatherCorrelation(),
      ]);
      setUtilizationData(util);
      setWindData(wind);
      setRevenueData(revenue);
      setCorrelations(corr);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a472a" />
        <Text style={styles.loadingText}>Loading analysis...</Text>
      </View>
    );
  }

  const renderChart = () => {
    switch (activeChart) {
      case 'utilization':
        return utilizationData && (
          <UtilizationChart
            data={utilizationData}
            title="Average Utilization by Hour"
          />
        );
      case 'wind':
        return windData && (
          <WindCorrelationChart
            data={windData}
            title="Wind Speed vs Utilization"
          />
        );
      case 'revenue':
        return revenueData && (
          <RevenueImpactChart
            data={revenueData}
            title="Revenue Impact by Location"
          />
        );
    }
  };

  const negativeCorrelations = correlations
    .filter(c => c.utilization_impact < -10)
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analysis</Text>
        <Text style={styles.subtitle}>Weather & Utilization Insights</Text>
      </View>

      {/* Chart Selector */}
      <View style={styles.chartSelector}>
        <TouchableOpacity
          style={[
            styles.chartTab,
            activeChart === 'utilization' && styles.chartTabActive,
          ]}
          onPress={() => setActiveChart('utilization')}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={activeChart === 'utilization' ? '#1a472a' : '#6b7280'}
          />
          <Text
            style={[
              styles.chartTabText,
              activeChart === 'utilization' && styles.chartTabTextActive,
            ]}
          >
            By Hour
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chartTab,
            activeChart === 'wind' && styles.chartTabActive,
          ]}
          onPress={() => setActiveChart('wind')}
        >
          <Ionicons
            name="speedometer-outline"
            size={18}
            color={activeChart === 'wind' ? '#1a472a' : '#6b7280'}
          />
          <Text
            style={[
              styles.chartTabText,
              activeChart === 'wind' && styles.chartTabTextActive,
            ]}
          >
            Wind Wall
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chartTab,
            activeChart === 'revenue' && styles.chartTabActive,
          ]}
          onPress={() => setActiveChart('revenue')}
        >
          <Ionicons
            name="cash-outline"
            size={18}
            color={activeChart === 'revenue' ? '#1a472a' : '#6b7280'}
          />
          <Text
            style={[
              styles.chartTabText,
              activeChart === 'revenue' && styles.chartTabTextActive,
            ]}
          >
            Revenue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Chart */}
      <View style={styles.chartContainer}>{renderChart()}</View>

      {/* Weather Correlations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weather Impact on Bookings</Text>
        <Text style={styles.sectionSubtitle}>
          Conditions with negative utilization impact
        </Text>

        {negativeCorrelations.map((corr, index) => (
          <View key={index} style={styles.correlationCard}>
            <View style={styles.correlationHeader}>
              <Text style={styles.correlationCondition}>
                {corr.weather_condition}
              </Text>
              <View
                style={[
                  styles.impactBadge,
                  corr.utilization_impact < -30
                    ? styles.impactSevere
                    : styles.impactModerate,
                ]}
              >
                <Text style={styles.impactText}>
                  {corr.utilization_impact.toFixed(0)}%
                </Text>
              </View>
            </View>
            <View style={styles.correlationDetails}>
              <Text style={styles.correlationBookingType}>
                {corr.booking_type.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.correlationStats}>
                {formatPercent(corr.avg_utilization)} avg utilization ({corr.sample_count} samples)
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a472a',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#86efac',
    marginTop: 4,
  },
  chartSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: -15,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  chartTabActive: {
    backgroundColor: '#dcfce7',
  },
  chartTabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartTabTextActive: {
    color: '#1a472a',
    fontWeight: '600',
  },
  chartContainer: {
    padding: 15,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 15,
  },
  correlationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  correlationCondition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  impactBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactSevere: {
    backgroundColor: '#fee2e2',
  },
  impactModerate: {
    backgroundColor: '#fef3c7',
  },
  impactText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
  },
  correlationDetails: {
    marginTop: 8,
  },
  correlationBookingType: {
    fontSize: 13,
    color: '#4b5563',
    textTransform: 'capitalize',
  },
  correlationStats: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  bottomPadding: {
    height: 30,
  },
});
