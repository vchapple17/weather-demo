import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LocationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Location Details</ThemedText>
        <ThemedText type="defaultSemiBold">{id}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.placeholder}>
        <ThemedText type="subtitle">Coming soon</ThemedText>
        <ThemedText>
          Per-facility dead zone breakdown, booking type performance, and weather sensitivity for this location.
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
