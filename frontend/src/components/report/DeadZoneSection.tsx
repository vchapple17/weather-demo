import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PeakDeadHour {
  hour: number;
  occurrences: number;
}

interface Props {
  totalDeadZoneHours: number;
  weatherRelatedCount: number;
  weatherRelatedPercent: number;
  behaviorRelatedCount: number;
  peakDeadHours: PeakDeadHour[];
  patterns: string[];
}

export const DeadZoneSection: React.FC<Props> = ({
  totalDeadZoneHours,
  weatherRelatedCount,
  weatherRelatedPercent,
  behaviorRelatedCount,
  peakDeadHours,
  patterns,
}) => {
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Dead Zone Analysis</Text>

      <Text style={styles.description}>
        Dead zones are hours with less than 15% utilization (excluding 12AM-6AM).
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#6b7280" />
          <Text style={styles.statValue}>{totalDeadZoneHours.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Dead Hours</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="rainy-outline" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{weatherRelatedCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Weather-Related ({weatherRelatedPercent}%)</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{behaviorRelatedCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Behavior-Related</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Peak Dead Zone Hours</Text>
        {peakDeadHours.map((item, index) => (
          <View key={index} style={styles.peakHourRow}>
            <View style={styles.peakHourBadge}>
              <Text style={styles.peakHourText}>{formatHour(item.hour)}</Text>
            </View>
            <View style={styles.peakHourBar}>
              <View
                style={[
                  styles.peakHourBarFill,
                  { width: `${Math.min((item.occurrences / peakDeadHours[0].occurrences) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.peakHourCount}>{item.occurrences}</Text>
          </View>
        ))}
      </View>

      <View style={styles.patternsCard}>
        <Text style={styles.cardTitle}>Patterns Identified</Text>
        {patterns.map((pattern, index) => (
          <View key={index} style={styles.patternItem}>
            <View style={styles.patternIcon}>
              <Ionicons name="trending-down" size={16} color="#dc2626" />
            </View>
            <Text style={styles.patternText}>{pattern}</Text>
          </View>
        ))}
      </View>
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
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
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
  peakHourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  peakHourBadge: {
    width: 60,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#1a472a',
    borderRadius: 6,
    marginRight: 12,
  },
  peakHourText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  peakHourBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  peakHourBarFill: {
    height: '100%',
    backgroundColor: '#dc2626',
    borderRadius: 4,
  },
  peakHourCount: {
    width: 50,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
  },
  patternsCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
  },
  patternItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  patternIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patternText: {
    flex: 1,
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
});
