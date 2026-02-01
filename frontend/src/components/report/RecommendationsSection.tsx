import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Recommendation {
  title: string;
  trigger: string | null;
  actions: string[];
  estimated_recovery: string | null;
}

interface Props {
  recommendations: Recommendation[];
}

const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  'Dynamic Pricing Implementation': 'pricetag-outline',
  'Dead Zone Promotions': 'megaphone-outline',
  'Weather-Triggered Campaigns': 'cloudy-outline',
  'Operational Pivot Strategy': 'settings-outline',
  'Indoor Facility Investment': 'business-outline',
};

const colorMap: { [key: string]: string } = {
  'Dynamic Pricing Implementation': '#7c3aed',
  'Dead Zone Promotions': '#2563eb',
  'Weather-Triggered Campaigns': '#0891b2',
  'Operational Pivot Strategy': '#059669',
  'Indoor Facility Investment': '#d97706',
};

export const RecommendationsSection: React.FC<Props> = ({ recommendations }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Strategic Recommendations</Text>

      {recommendations.map((rec, index) => {
        const iconName = iconMap[rec.title] || 'bulb-outline';
        const color = colorMap[rec.title] || '#6b7280';

        return (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={iconName} size={22} color={color} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.cardTitle}>{rec.title}</Text>
                {rec.trigger && (
                  <View style={styles.triggerBadge}>
                    <Ionicons name="flash" size={12} color="#6b7280" />
                    <Text style={styles.triggerText}>{rec.trigger}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actionsContainer}>
              {rec.actions.map((action, actionIndex) => (
                <View key={actionIndex} style={styles.actionItem}>
                  <View style={[styles.actionDot, { backgroundColor: color }]} />
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>

            {rec.estimated_recovery && (
              <View style={styles.recoveryContainer}>
                <Ionicons name="trending-up" size={16} color="#059669" />
                <Text style={styles.recoveryText}>
                  <Text style={styles.recoveryLabel}>Estimated Recovery: </Text>
                  {rec.estimated_recovery}
                </Text>
              </View>
            )}
          </View>
        );
      })}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  triggerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  triggerText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionsContainer: {
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  actionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  recoveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  recoveryText: {
    flex: 1,
    fontSize: 14,
    color: '#065f46',
  },
  recoveryLabel: {
    fontWeight: '600',
  },
});
