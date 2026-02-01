import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RevenueLeak {
  location: string;
  booking_type_display: string;
  lost_revenue: number;
  dead_zone_hours: number;
  primary_cause: string;
}

interface Props {
  totalLostRevenue: number;
  weatherRelatedLosses: number;
  weatherRelatedPercent: number;
  behaviorRelatedLosses: number;
  behaviorRelatedPercent: number;
  topRevenueLeaks: RevenueLeak[];
  windWallMph: number | null;
  windWallUtilizationDrop: string | null;
}

export const ExecutiveSummary: React.FC<Props> = ({
  totalLostRevenue,
  weatherRelatedLosses,
  weatherRelatedPercent,
  behaviorRelatedLosses,
  behaviorRelatedPercent,
  topRevenueLeaks,
  windWallMph,
  windWallUtilizationDrop,
}) => {
  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Executive Summary</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Revenue Impact</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Estimated Lost Revenue</Text>
          <Text style={styles.statValueLarge}>{formatCurrency(totalLostRevenue)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <View style={styles.statWithIcon}>
            <Ionicons name="rainy-outline" size={16} color="#6b7280" />
            <Text style={styles.statLabel}>Weather-Related</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(weatherRelatedLosses)} ({weatherRelatedPercent}%)</Text>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statWithIcon}>
            <Ionicons name="people-outline" size={16} color="#6b7280" />
            <Text style={styles.statLabel}>Behavior-Related</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(behaviorRelatedLosses)} ({behaviorRelatedPercent}%)</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top 3 Revenue Leaks</Text>
        {topRevenueLeaks.map((leak, index) => (
          <View key={index} style={styles.leakItem}>
            <View style={styles.leakHeader}>
              <View style={styles.leakRank}>
                <Text style={styles.leakRankText}>{index + 1}</Text>
              </View>
              <View style={styles.leakInfo}>
                <Text style={styles.leakLocation}>{leak.location}</Text>
                <Text style={styles.leakType}>{leak.booking_type_display}</Text>
              </View>
            </View>
            <View style={styles.leakStats}>
              <View style={styles.leakStat}>
                <Text style={styles.leakStatValue}>{formatCurrency(leak.lost_revenue)}</Text>
                <Text style={styles.leakStatLabel}>Lost Revenue</Text>
              </View>
              <View style={styles.leakStat}>
                <Text style={styles.leakStatValue}>{leak.dead_zone_hours}</Text>
                <Text style={styles.leakStatLabel}>Dead Hours</Text>
              </View>
              <View style={[styles.causeBadge, leak.primary_cause === 'Weather' ? styles.weatherBadge : styles.behaviorBadge]}>
                <Text style={styles.causeBadgeText}>{leak.primary_cause}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {windWallMph && (
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons name="warning" size={24} color="#f59e0b" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Key Wind Insight</Text>
            <Text style={styles.insightText}>
              Golf round bookings collapse when wind exceeds <Text style={styles.bold}>{windWallMph} mph</Text> - utilization drops from {windWallUtilizationDrop}.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  statValueLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  leakItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  leakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  leakRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a472a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leakRankText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  leakInfo: {
    flex: 1,
  },
  leakLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  leakType: {
    fontSize: 13,
    color: '#6b7280',
  },
  leakStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 40,
    gap: 16,
  },
  leakStat: {
    alignItems: 'flex-start',
  },
  leakStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  leakStatLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  causeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  weatherBadge: {
    backgroundColor: '#dbeafe',
  },
  behaviorBadge: {
    backgroundColor: '#fef3c7',
  },
  causeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  insightIcon: {
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
});
