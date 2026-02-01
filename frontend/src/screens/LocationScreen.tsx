import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  apiClient,
  Location,
  LocationSummary,
  DeadZone,
} from '../api/client';
import { LocationList } from '../components/LocationList';
import { DeadZoneCard } from '../components/DeadZoneCard';
import { formatCurrency, formatPercent } from '../utils/formatting';

interface Props {
  navigation: any;
  route: any;
}

export const LocationScreen: React.FC<Props> = ({ navigation, route }) => {
  const selectedLocationId = route.params?.locationId;

  const [locations, setLocations] = useState<Location[]>([]);
  const [summaries, setSummaries] = useState<Map<string, LocationSummary>>(new Map());
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationSummary, setLocationSummary] = useState<LocationSummary | null>(null);
  const [deadZones, setDeadZones] = useState<DeadZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLocations = async () => {
    try {
      const locs = await apiClient.getLocations();
      setLocations(locs);

      // Load summaries for all locations
      const summaryMap = new Map<string, LocationSummary>();
      const summaryPromises = locs.map(async (loc) => {
        try {
          const summary = await apiClient.getLocationSummary(loc.id);
          summaryMap.set(loc.id, summary);
        } catch (e) {
          console.error(`Error loading summary for ${loc.id}:`, e);
        }
      });
      await Promise.all(summaryPromises);
      setSummaries(summaryMap);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLocationDetails = async (locationId: string) => {
    try {
      setLoading(true);
      const [loc, summary, zones] = await Promise.all([
        apiClient.getLocation(locationId),
        apiClient.getLocationSummary(locationId),
        apiClient.getDeadZones(locationId, 50),
      ]);
      setSelectedLocation(loc);
      setLocationSummary(summary);
      setDeadZones(zones);
    } catch (error) {
      console.error('Error loading location details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLocationId) {
      loadLocationDetails(selectedLocationId);
    } else {
      loadLocations();
    }
  }, [selectedLocationId]);

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedLocationId) {
      loadLocationDetails(selectedLocationId);
    } else {
      loadLocations();
    }
  };

  const handleLocationPress = (location: Location) => {
    navigation.push('LocationDetail', { locationId: location.id });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a472a" />
        <Text style={styles.loadingText}>
          {selectedLocationId ? 'Loading location...' : 'Loading locations...'}
        </Text>
      </View>
    );
  }

  // Location detail view
  if (selectedLocation && locationSummary) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#fff"
              onPress={handleBack}
            />
            <Text style={styles.headerCity}>
              {selectedLocation.city}, {selectedLocation.state}
            </Text>
          </View>
          <Text style={styles.title}>{selectedLocation.name}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatPercent(locationSummary.avg_utilization)}
              </Text>
              <Text style={styles.statLabel}>Avg Utilization</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {locationSummary.total_reservations.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.revenueValue]}>
                {formatCurrency(locationSummary.total_revenue)}
              </Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.lossValue]}>
                {formatCurrency(locationSummary.dead_zone_revenue_loss)}
              </Text>
              <Text style={styles.statLabel}>Lost Revenue</Text>
            </View>
          </View>

          {/* Booking Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Services</Text>
            <View style={styles.bookingTypes}>
              {selectedLocation.available_booking_types.map((type) => (
                <View key={type} style={styles.bookingTypeTag}>
                  <Ionicons
                    name={type.includes('INDOOR') ? 'home' : 'golf'}
                    size={14}
                    color="#1a472a"
                  />
                  <Text style={styles.bookingTypeText}>
                    {type.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Dead Zones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Recent Dead Zones ({locationSummary.dead_zone_count} total)
            </Text>
            {deadZones.slice(0, 10).map((dz, index) => (
              <DeadZoneCard key={index} deadZone={dz} />
            ))}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    );
  }

  // Location list view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Locations</Text>
        <Text style={styles.subtitle}>{locations.length} Golf Facilities</Text>
      </View>

      <LocationList
        locations={locations}
        summaries={summaries}
        onLocationPress={handleLocationPress}
        loading={loading}
      />
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a472a',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerCity: {
    color: '#86efac',
    fontSize: 14,
    marginLeft: 12,
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
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    marginTop: -15,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  revenueValue: {
    color: '#22c55e',
  },
  lossValue: {
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
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
  bookingTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookingTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  bookingTypeText: {
    fontSize: 12,
    color: '#1a472a',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bottomPadding: {
    height: 30,
  },
});
