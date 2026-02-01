import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Location, LocationSummary } from '../api/client';
import { formatCurrency, formatPercent } from '../utils/formatting';

interface Props {
  locations: Location[];
  summaries?: Map<string, LocationSummary>;
  onLocationPress: (location: Location) => void;
  loading?: boolean;
}

export const LocationList: React.FC<Props> = ({
  locations,
  summaries,
  onLocationPress,
  loading,
}) => {
  const renderLocation = ({ item }: { item: Location }) => {
    const summary = summaries?.get(item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onLocationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.locationInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.location}>
              {item.city}, {item.state}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>

        <View style={styles.bookingTypes}>
          {item.available_booking_types.slice(0, 4).map((type, index) => (
            <View key={type} style={styles.typeTag}>
              <Text style={styles.typeText}>
                {type.replace(/_/g, ' ').toLowerCase()}
              </Text>
            </View>
          ))}
          {item.available_booking_types.length > 4 && (
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>
                +{item.available_booking_types.length - 4}
              </Text>
            </View>
          )}
        </View>

        {summary && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatPercent(summary.avg_utilization)}
              </Text>
              <Text style={styles.statLabel}>Avg. Util.</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.dead_zone_count}</Text>
              <Text style={styles.statLabel}>Dead Zones</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.lossValue]}>
                {formatCurrency(summary.dead_zone_revenue_loss)}
              </Text>
              <Text style={styles.statLabel}>Lost Revenue</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a472a" />
        <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={locations}
      renderItem={renderLocation}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  bookingTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  typeTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    color: '#4b5563',
    textTransform: 'capitalize',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  lossValue: {
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
});
