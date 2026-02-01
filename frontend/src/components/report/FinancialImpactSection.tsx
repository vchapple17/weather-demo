import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FinancialByType {
  booking_type: string;
  lost_revenue: number;
}

interface FinancialByLocation {
  location: string;
  lost_revenue: number;
}

interface Props {
  byBookingType: FinancialByType[];
  byLocation: FinancialByLocation[];
}

export const FinancialImpactSection: React.FC<Props> = ({ byBookingType, byLocation }) => {
  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const maxTypeRevenue = byBookingType.length > 0 ? byBookingType[0].lost_revenue : 1;
  const maxLocationRevenue = byLocation.length > 0 ? byLocation[0].lost_revenue : 1;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Financial Impact Analysis</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lost Revenue by Booking Type</Text>
        {byBookingType.map((item, index) => (
          <View key={index} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.booking_type}</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  { width: `${(item.lost_revenue / maxTypeRevenue) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{formatCurrency(item.lost_revenue)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top 5 Locations by Revenue Loss</Text>
        {byLocation.map((item, index) => (
          <View key={index} style={styles.locationRow}>
            <View style={styles.locationRank}>
              <Text style={styles.locationRankText}>{index + 1}</Text>
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item.location}</Text>
              <View style={styles.locationBarContainer}>
                <View
                  style={[
                    styles.locationBar,
                    { width: `${(item.lost_revenue / maxLocationRevenue) * 100}%` },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.locationValue}>{formatCurrency(item.lost_revenue)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.opportunityCard}>
        <View style={styles.opportunityHeader}>
          <Ionicons name="trending-up" size={20} color="#059669" />
          <Text style={styles.opportunityTitle}>Opportunity Cost</Text>
        </View>
        <Text style={styles.opportunityText}>
          These figures represent revenue that could have been captured with:
        </Text>
        <View style={styles.opportunityList}>
          <View style={styles.opportunityItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.opportunityItemText}>Dynamic pricing during low-demand periods</Text>
          </View>
          <View style={styles.opportunityItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.opportunityItemText}>Weather-triggered promotional campaigns</Text>
          </View>
          <View style={styles.opportunityItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.opportunityItemText}>Operational adjustments to staffing and resources</Text>
          </View>
        </View>
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
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barRow: {
    marginBottom: 14,
  },
  barLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
  },
  barContainer: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bar: {
    height: '100%',
    backgroundColor: '#dc2626',
    borderRadius: 5,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    textAlign: 'right',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  locationInfo: {
    flex: 1,
    marginRight: 12,
  },
  locationName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  locationBarContainer: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  locationBar: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 90,
    textAlign: 'right',
  },
  opportunityCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
  },
  opportunityText: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 12,
  },
  opportunityList: {
    gap: 8,
  },
  opportunityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  opportunityItemText: {
    fontSize: 14,
    color: '#065f46',
  },
});
