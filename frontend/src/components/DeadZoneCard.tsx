import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeadZone } from '../api/client';
import { formatCurrency, formatPercent, formatBookingType, formatHour } from '../utils/formatting';

interface Props {
  deadZone: DeadZone;
}

export const DeadZoneCard: React.FC<Props> = ({ deadZone }) => {
  const date = new Date(deadZone.date);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName} numberOfLines={1}>
            {deadZone.location_name}
          </Text>
          <Text style={styles.bookingType}>
            {formatBookingType(deadZone.booking_type)}
          </Text>
        </View>
        <View style={[
          styles.badge,
          deadZone.weather_related ? styles.weatherBadge : styles.behaviorBadge
        ]}>
          <Ionicons
            name={deadZone.weather_related ? 'rainy' : 'person'}
            size={12}
            color="#fff"
          />
          <Text style={styles.badgeText}>
            {deadZone.weather_related ? 'Weather' : 'Behavior'}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {dateStr} at {formatHour(deadZone.hour)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="trending-down" size={16} color="#ef4444" />
          <Text style={styles.detailText}>
            {formatPercent(deadZone.utilization_rate)} utilization
          </Text>
        </View>

        {deadZone.weather_condition && (
          <View style={styles.detailRow}>
            <Ionicons name="cloud-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{deadZone.weather_condition}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.lostRevenueLabel}>Lost Revenue</Text>
        <Text style={styles.lostRevenueValue}>
          {formatCurrency(deadZone.lost_revenue)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 6,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
    marginRight: 10,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  bookingType: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weatherBadge: {
    backgroundColor: '#6b7280',
  },
  behaviorBadge: {
    backgroundColor: '#f59e0b',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4b5563',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  lostRevenueLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  lostRevenueValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
});
