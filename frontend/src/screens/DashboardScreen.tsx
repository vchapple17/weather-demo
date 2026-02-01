import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient, ReportSummary, WindThreshold } from '../api/client';
import { formatCurrency, formatNumber } from '../utils/formatting';

interface Props {
  navigation: any;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [windThresholds, setWindThresholds] = useState<WindThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [summaryData, windData] = await Promise.all([
        apiClient.getReportSummary(),
        apiClient.getWindThreshold(),
      ]);
      setSummary(summaryData);
      setWindThresholds(windData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const golfThreshold = windThresholds.find(wt => wt.booking_type.includes('HOLE'));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Golf Insights</Text>
        <Text style={styles.subtitle}>Weather & Utilization Analysis</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Ionicons name="trending-down" size={24} color="#ef4444" />
          <Text style={styles.metricValue}>
            {formatCurrency(summary?.total_lost_revenue || 0)}
          </Text>
          <Text style={styles.metricLabel}>Total Lost Revenue</Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name="time-outline" size={24} color="#f59e0b" />
          <Text style={styles.metricValue}>
            {formatNumber(summary?.total_dead_zone_hours || 0)}
          </Text>
          <Text style={styles.metricLabel}>Dead Zone Hours</Text>
        </View>
      </View>

      {/* Wind Wall Insight */}
      {golfThreshold && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.insightTitle}>Wind Wall Alert</Text>
          </View>
          <Text style={styles.insightText}>
            Golf bookings collapse when wind exceeds{' '}
            <Text style={styles.highlight}>{golfThreshold.wind_wall_mph} mph</Text>
          </Text>
          <View style={styles.insightStats}>
            <View style={styles.insightStat}>
              <Text style={styles.insightStatValue}>
                {(golfThreshold.utilization_below_threshold * 100).toFixed(0)}%
              </Text>
              <Text style={styles.insightStatLabel}>Below threshold</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
            <View style={styles.insightStat}>
              <Text style={[styles.insightStatValue, styles.alertValue]}>
                {(golfThreshold.utilization_above_threshold * 100).toFixed(0)}%
              </Text>
              <Text style={styles.insightStatLabel}>Above threshold</Text>
            </View>
          </View>
        </View>
      )}

      {/* Revenue Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue Loss Breakdown</Text>
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Ionicons name="rainy" size={18} color="#6b7280" />
              <Text style={styles.breakdownLabel}>Weather-Related</Text>
            </View>
            <Text style={styles.breakdownValue}>
              {formatCurrency(summary?.weather_related_losses || 0)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Ionicons name="person" size={18} color="#f59e0b" />
              <Text style={styles.breakdownLabel}>Behavior-Related</Text>
            </View>
            <Text style={styles.breakdownValue}>
              {formatCurrency(summary?.behavior_related_losses || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Top Revenue Leaks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Revenue Leaks</Text>
        {summary?.top_revenue_leaks.map((leak, index) => (
          <View key={index} style={styles.leakCard}>
            <View style={styles.leakRank}>
              <Text style={styles.leakRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.leakInfo}>
              <Text style={styles.leakLocation}>{leak.location}</Text>
              <Text style={styles.leakType}>
                {leak.booking_type.replace(/_/g, ' ')}
              </Text>
            </View>
            <View style={styles.leakStats}>
              <Text style={styles.leakRevenue}>
                {formatCurrency(leak.lost_revenue)}
              </Text>
              <Text style={styles.leakHours}>{leak.dead_zone_hours} hours</Text>
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
  metricsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 12,
    marginTop: -20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#78350f',
    marginTop: 8,
    lineHeight: 20,
  },
  highlight: {
    fontWeight: '700',
    color: '#ef4444',
  },
  insightStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 15,
  },
  insightStat: {
    alignItems: 'center',
  },
  insightStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  alertValue: {
    color: '#ef4444',
  },
  insightStatLabel: {
    fontSize: 11,
    color: '#78350f',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 10,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  leakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leakRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leakRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  leakInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leakLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  leakType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  leakStats: {
    alignItems: 'flex-end',
  },
  leakRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  leakHours: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  bottomPadding: {
    height: 30,
  },
});
