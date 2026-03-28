import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RevenueScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Revenue Leaks</ThemedText>
        <ThemedText type="default">Dead zone patterns ranked by estimated lost revenue</ThemedText>
      </ThemedView>

      <ThemedView style={styles.placeholder}>
        <ThemedText type="subtitle">Coming soon</ThemedText>
        <ThemedText>
          Ranked list of dead zone patterns with revenue impact, filterable by location and booking type.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    gap: 24,
  },
  header: {
    gap: 6,
  },
  placeholder: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    opacity: 0.6,
  },
});
