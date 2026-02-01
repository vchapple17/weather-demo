import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WeatherCorrelationEntry {
  booking_type: string;
  weather_condition: string;
  avg_utilization: number;
  impact_vs_baseline: number;
}

interface Props {
  negativeImpacts: WeatherCorrelationEntry[];
  positiveImpacts: WeatherCorrelationEntry[];
  keyFindings: string[];
}

export const WeatherCorrelationSection: React.FC<Props> = ({
  negativeImpacts,
  positiveImpacts,
  keyFindings,
}) => {
  const renderImpactTable = (
    title: string,
    data: WeatherCorrelationEntry[],
    isNegative: boolean
  ) => (
    <View style={styles.tableContainer}>
      <Text style={styles.tableTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={[styles.tableHeader, isNegative ? styles.negativeHeader : styles.positiveHeader]}>
          <Text style={[styles.tableCell, styles.headerCell, { flex: 2 }]}>Booking Type</Text>
          <Text style={[styles.tableCell, styles.headerCell, { flex: 2 }]}>Condition</Text>
          <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Avg Util</Text>
          <Text style={[styles.tableCell, styles.headerCell, { flex: 1 }]}>Impact</Text>
        </View>
        {data.map((entry, index) => (
          <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{entry.booking_type}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{entry.weather_condition}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{entry.avg_utilization}%</Text>
            <Text style={[styles.tableCell, isNegative ? styles.negativeImpact : styles.positiveImpact, { flex: 1 }]}>
              {entry.impact_vs_baseline > 0 ? '+' : ''}{entry.impact_vs_baseline}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Weather Correlation Analysis</Text>

      {negativeImpacts.length > 0 && renderImpactTable('Negative Weather Impacts', negativeImpacts, true)}
      {positiveImpacts.length > 0 && renderImpactTable('Positive/Neutral Conditions', positiveImpacts, false)}

      <View style={styles.findingsCard}>
        <View style={styles.findingsHeader}>
          <Ionicons name="analytics-outline" size={18} color="#1e40af" />
          <Text style={styles.findingsTitle}>Key Findings</Text>
        </View>
        {keyFindings.map((finding, index) => (
          <View key={index} style={styles.findingItem}>
            <View style={styles.findingNumber}>
              <Text style={styles.findingNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.findingText}>{finding}</Text>
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
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableContainer: {
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  negativeHeader: {
    backgroundColor: '#dc2626',
  },
  positiveHeader: {
    backgroundColor: '#059669',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  headerCell: {
    color: '#fff',
    fontWeight: '600',
  },
  negativeImpact: {
    color: '#dc2626',
    fontWeight: '600',
  },
  positiveImpact: {
    color: '#059669',
    fontWeight: '600',
  },
  findingsCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
  },
  findingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  findingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  findingItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  findingNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  findingNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  findingText: {
    flex: 1,
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
});
