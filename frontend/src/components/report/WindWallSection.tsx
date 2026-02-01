import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WindWallEntry {
  booking_type: string;
  wind_threshold_mph: number;
  utilization_below: number;
  utilization_above: number;
  drop_percent: number;
}

interface Props {
  entries: WindWallEntry[];
  interpretation: string[];
}

export const WindWallSection: React.FC<Props> = ({ entries, interpretation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Wind Wall Analysis</Text>

      <Text style={styles.description}>
        The "Wind Wall" is the wind speed threshold at which customer bookings significantly decline.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.headerCell, { flex: 2 }]}>Booking Type</Text>
          <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Threshold</Text>
          <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Below</Text>
          <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Above</Text>
          <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Drop</Text>
        </View>
        {entries.map((entry, index) => (
          <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{entry.booking_type}</Text>
            <Text style={[styles.tableCell, styles.threshold, { flex: 1 }]}>{entry.wind_threshold_mph} mph</Text>
            <Text style={[styles.tableCell, styles.good, { flex: 1 }]}>{entry.utilization_below}%</Text>
            <Text style={[styles.tableCell, styles.bad, { flex: 1 }]}>{entry.utilization_above}%</Text>
            <Text style={[styles.tableCell, styles.drop, { flex: 1 }]}>-{entry.drop_percent}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.interpretationCard}>
        <View style={styles.interpretationHeader}>
          <Ionicons name="bulb-outline" size={18} color="#1a472a" />
          <Text style={styles.interpretationTitle}>Interpretation</Text>
        </View>
        {interpretation.map((item, index) => (
          <View key={index} style={styles.interpretationItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.interpretationText}>{item}</Text>
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
  table: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a472a',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
  },
  headerCell: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  threshold: {
    fontWeight: '600',
    color: '#1a472a',
  },
  good: {
    color: '#059669',
  },
  bad: {
    color: '#dc2626',
  },
  drop: {
    color: '#dc2626',
    fontWeight: '600',
  },
  interpretationCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
  },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  interpretationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a472a',
  },
  interpretationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    color: '#1a472a',
    marginRight: 8,
    fontSize: 14,
  },
  interpretationText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
});
