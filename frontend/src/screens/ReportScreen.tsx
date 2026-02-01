import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Share,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient, StructuredReport } from '../api/client';
import {
  ExecutiveSummary,
  WindWallSection,
  WeatherCorrelationSection,
  DeadZoneSection,
  FinancialImpactSection,
  RecommendationsSection,
} from '../components/report';

export const ReportScreen: React.FC = () => {
  const [report, setReport] = useState<StructuredReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setError(null);
      const reportData = await apiClient.getStructuredReport();
      setReport(reportData);
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Failed to load report. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReport();
  };

  const shareReport = async () => {
    if (!report) return;
    try {
      const summary = `Golf Utilization Report\n\nTotal Lost Revenue: $${report.executive_summary.total_lost_revenue.toLocaleString()}\nWeather-Related: ${report.executive_summary.weather_related_percent}%\nBehavior-Related: ${report.executive_summary.behavior_related_percent}%`;
      await Share.share({
        message: summary,
        title: 'Golf Utilization Report',
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a472a" />
        <Text style={styles.loadingText}>Generating report...</Text>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text style={styles.errorText}>{error || 'Failed to load report'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReport}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Strategic Report</Text>
          <Text style={styles.subtitle}>{report.analysis_period}</Text>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={shareReport}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ExecutiveSummary
          totalLostRevenue={report.executive_summary.total_lost_revenue}
          weatherRelatedLosses={report.executive_summary.weather_related_losses}
          weatherRelatedPercent={report.executive_summary.weather_related_percent}
          behaviorRelatedLosses={report.executive_summary.behavior_related_losses}
          behaviorRelatedPercent={report.executive_summary.behavior_related_percent}
          topRevenueLeaks={report.executive_summary.top_revenue_leaks}
          windWallMph={report.executive_summary.wind_wall_mph}
          windWallUtilizationDrop={report.executive_summary.wind_wall_utilization_drop}
        />

        <WindWallSection
          entries={report.wind_wall.entries}
          interpretation={report.wind_wall.interpretation}
        />

        <WeatherCorrelationSection
          negativeImpacts={report.weather_correlation.negative_impacts}
          positiveImpacts={report.weather_correlation.positive_impacts}
          keyFindings={report.weather_correlation.key_findings}
        />

        <DeadZoneSection
          totalDeadZoneHours={report.dead_zones.total_dead_zone_hours}
          weatherRelatedCount={report.dead_zones.weather_related_count}
          weatherRelatedPercent={report.dead_zones.weather_related_percent}
          behaviorRelatedCount={report.dead_zones.behavior_related_count}
          peakDeadHours={report.dead_zones.peak_dead_hours}
          patterns={report.dead_zones.patterns}
        />

        <FinancialImpactSection
          byBookingType={report.financial_impact.by_booking_type}
          byLocation={report.financial_impact.by_location}
        />

        <RecommendationsSection recommendations={report.recommendations} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated: {new Date(report.generated_at).toLocaleString()}
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#1a472a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomPadding: {
    height: 30,
  },
});
