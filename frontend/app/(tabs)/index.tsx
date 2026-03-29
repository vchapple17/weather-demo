import { useState, useMemo } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { generateForecast, type ForecastDay, type ForecastSlot } from '@/data/mock/forecast';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FORECAST = generateForecast();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function utilColor(u: number): string {
  if (u >= 65) return '#27ae60';
  if (u >= 40) return '#e67e22';
  return '#e74c3c';
}

function utilLabel(u: number): string {
  if (u >= 65) return 'On track';
  if (u >= 40) return 'Marginal';
  return 'At risk';
}

// ---------------------------------------------------------------------------
// Day picker pill
// ---------------------------------------------------------------------------

function DayPill({ day, selected, onPress }: { day: ForecastDay; selected: boolean; onPress: () => void }) {
  const hasHighUrgency = day.promoSlots.some(s => s.promoUrgency === 'high');
  const hasMedUrgency = day.promoSlots.length > 0;

  return (
    <TouchableOpacity style={[styles.dayPill, selected && styles.dayPillSelected]} onPress={onPress}>
      <Text style={[styles.dayPillLabel, selected && styles.dayPillTextSelected]}>{day.dayLabel}</Text>
      <Text style={[styles.dayPillDate, selected && styles.dayPillTextSelected]}>{day.dateLabel}</Text>
      {hasMedUrgency && (
        <View style={[styles.dayDot, { backgroundColor: hasHighUrgency ? '#e74c3c' : '#e67e22' }]} />
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Weather card
// ---------------------------------------------------------------------------

function WeatherCard({ day }: { day: ForecastDay }) {
  const { weather } = day;
  return (
    <View style={[styles.weatherCard, { backgroundColor: weather.cardColor }]}>
      <View style={styles.weatherMain}>
        <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
        <View>
          <Text style={styles.weatherTemp}>{weather.tempF}°F</Text>
          <Text style={styles.weatherCondition}>{weather.conditionLabel}</Text>
          <Text style={styles.weatherFeels}>Feels like {weather.feelsLikeF}°F</Text>
        </View>
      </View>
      <View style={styles.weatherStats}>
        <WeatherStat icon="💨" value={`${weather.windMph} mph`} label="Wind" />
        <WeatherStat icon="🌧️" value={`${weather.precipInches}"`} label="Rain" />
        <WeatherStat icon="💧" value={`${weather.humidity}%`} label="Humidity" />
        <WeatherStat icon="☀️" value={`UV ${weather.uvIndex}`} label="UV Index" />
      </View>
    </View>
  );
}

function WeatherStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.weatherStat}>
      <Text style={styles.weatherStatIcon}>{icon}</Text>
      <Text style={styles.weatherStatValue}>{value}</Text>
      <Text style={styles.weatherStatLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slot card
// ---------------------------------------------------------------------------

function SlotCard({ slot, compact = false }: { slot: ForecastSlot; compact?: boolean }) {
  const color = utilColor(slot.predictedUtilization);
  const isHigh = slot.promoUrgency === 'high';

  return (
    <View style={[styles.slotCard, slot.promoRecommended && { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.slotHeader}>
        <View>
          <Text style={styles.slotTime}>{slot.timeLabel}</Text>
          <Text style={styles.slotType}>{slot.bookingTypeLabel}</Text>
        </View>
        <View style={styles.slotRightCol}>
          <Text style={[styles.slotPct, { color }]}>{slot.predictedUtilization}%</Text>
          <Text style={[styles.slotStatusLabel, { color }]}>{utilLabel(slot.predictedUtilization)}</Text>
        </View>
      </View>

      {/* Fill bar */}
      <View style={styles.fillBarBg}>
        <View style={[styles.fillBarFill, { width: `${slot.predictedUtilization}%`, backgroundColor: color }]} />
      </View>

      {slot.promoRecommended && (
        <View style={[styles.promoBadge, { backgroundColor: isHigh ? '#FDEDEC' : '#FEF9E7' }]}>
          <Text style={styles.promoBadgeIcon}>{isHigh ? '🏷️' : '💡'}</Text>
          <View style={styles.promoBadgeText}>
            <Text style={[styles.promoTitle, { color: isHigh ? '#C0392B' : '#D35400' }]}>
              {isHigh ? 'Promotion recommended' : 'Consider discount'}
            </Text>
            <Text style={styles.promoReason}>{slot.promoReason}</Text>
            <Text style={styles.promoMeta}>
              Suggest {slot.suggestedDiscount}  ·  Est. loss at current rate: ${slot.estimatedRevenueLoss}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ForecastScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const day = FORECAST[selectedIndex];
  const { promoSlots, slots } = day;

  // For "All Slots": group by hour, pick the primary booking type per hour
  const allSlotsByHour = useMemo(() => {
    const hours = [...new Set(slots.map(s => s.hour))].sort((a, b) => a - b);
    return hours.map(h => slots.filter(s => s.hour === h));
  }, [slots]);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forecast</Text>
        <Text style={styles.headerSub}>Sunset Valley Golf Club</Text>
      </View>

      {/* Day picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
        {FORECAST.map((d, i) => (
          <DayPill key={i} day={d} selected={i === selectedIndex} onPress={() => { setSelectedIndex(i); setShowAll(false); }} />
        ))}
      </ScrollView>

      {/* Weather card */}
      <WeatherCard day={day} />

      {/* Promo opportunities */}
      {promoSlots.length === 0 ? (
        <View style={styles.allClearCard}>
          <Text style={styles.allClearEmoji}>✅</Text>
          <Text style={styles.allClearTitle}>All slots on track</Text>
          <Text style={styles.allClearSub}>No promotions needed for {day.dayLabel.toLowerCase()}.</Text>
        </View>
      ) : (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {promoSlots.length} slot{promoSlots.length !== 1 ? 's' : ''} need attention
            </Text>
            <View style={[styles.urgencyBadge, {
              backgroundColor: promoSlots.some(s => s.promoUrgency === 'high') ? '#e74c3c' : '#e67e22'
            }]}>
              <Text style={styles.urgencyBadgeText}>
                {promoSlots.filter(s => s.promoUrgency === 'high').length} high priority
              </Text>
            </View>
          </View>
          {promoSlots.map((slot, i) => (
            <SlotCard key={`${slot.bookingType}-${slot.hour}-${i}`} slot={slot} />
          ))}
        </View>
      )}

      {/* Full schedule toggle */}
      <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowAll(v => !v)}>
        <Text style={styles.toggleBtnText}>{showAll ? 'Hide full schedule ▲' : 'Show full schedule ▼'}</Text>
      </TouchableOpacity>

      {showAll && (
        <View>
          <Text style={styles.sectionTitle}>All Time Slots</Text>
          {allSlotsByHour.map((hourSlots, hi) => (
            <View key={hi}>
              {hi > 0 && <View style={styles.divider} />}
              {hourSlots.map((slot, si) => (
                <SlotCard key={`${slot.bookingType}-${slot.hour}-${si}`} slot={slot} />
              ))}
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingTop: 56,
    paddingHorizontal: 16,
    gap: 16,
  },

  // Header
  header: { gap: 2 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
  headerSub: { fontSize: 14, color: '#687076' },

  // Day picker
  dayPicker: { flexGrow: 0, marginHorizontal: -16, paddingHorizontal: 16 },
  dayPill: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F0F2F4',
    marginRight: 8,
    minWidth: 64,
    position: 'relative',
  },
  dayPillSelected: { backgroundColor: '#0a7ea4' },
  dayPillLabel: { fontSize: 13, fontWeight: '600', color: '#687076' },
  dayPillDate: { fontSize: 11, color: '#9BA1A6', marginTop: 2 },
  dayPillTextSelected: { color: '#fff' },
  dayDot: {
    position: 'absolute',
    top: 6, right: 6,
    width: 7, height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  // Weather card
  weatherCard: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  weatherEmoji: { fontSize: 52 },
  weatherTemp: { fontSize: 42, fontWeight: '700', color: '#fff' },
  weatherCondition: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  weatherFeels: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  weatherStats: { flexDirection: 'row', justifyContent: 'space-between' },
  weatherStat: { alignItems: 'center', gap: 2 },
  weatherStatIcon: { fontSize: 18 },
  weatherStatValue: { fontSize: 13, fontWeight: '600', color: '#fff' },
  weatherStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)' },

  // All clear
  allClearCard: {
    backgroundColor: '#EAFAF1',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  allClearEmoji: { fontSize: 28 },
  allClearTitle: { fontSize: 16, fontWeight: '700', color: '#1E8449' },
  allClearSub: { fontSize: 13, color: '#28B463', textAlign: 'center' },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#11181C' },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  urgencyBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Slot card
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
  },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  slotTime: { fontSize: 15, fontWeight: '700', color: '#11181C' },
  slotType: { fontSize: 13, color: '#687076', marginTop: 2 },
  slotRightCol: { alignItems: 'flex-end' },
  slotPct: { fontSize: 20, fontWeight: '700' },
  slotStatusLabel: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  // Fill bar
  fillBarBg: { height: 6, backgroundColor: '#F0F2F4', borderRadius: 3, overflow: 'hidden' },
  fillBarFill: { height: 6, borderRadius: 3 },

  // Promo badge
  promoBadge: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: 8, alignItems: 'flex-start' },
  promoBadgeIcon: { fontSize: 18, marginTop: 1 },
  promoBadgeText: { flex: 1, gap: 3 },
  promoTitle: { fontSize: 13, fontWeight: '700' },
  promoReason: { fontSize: 12, color: '#444', lineHeight: 17 },
  promoMeta: { fontSize: 11, color: '#888', marginTop: 2 },

  // Toggle
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F0F2F4',
    borderRadius: 10,
  },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: '#0a7ea4' },

  divider: { height: 1, backgroundColor: '#F0F2F4', marginVertical: 4 },
});
