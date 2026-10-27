import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CatalogStack from './CatalogStack';
import CatalogComingSoonScreen from '../screens/CatalogComingSoonScreen';
import { getCatalogConfig } from '../services/api';

// The last answer, so reopening the tab does not flash a spinner
let lastKnown: boolean | null = null;

// The Catalog tab. The backend can switch the catalog off (Catalog__Enabled in .env): the tab then shows
// "Coming soon" instead of the catalog. The answer is asked for again each time the tab is opened.
export default function CatalogGate() {
  const [enabled, setEnabled] = useState<boolean | null>(lastKnown);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getCatalogConfig().then(res => {
        if (cancelled) return;
        // If the question cannot be answered, keep what we knew (or open: the server refuses calls while it is locked)
        const value =
          res.success && res.data ? res.data.enabled : lastKnown ?? true;
        lastKnown = value;
        setEnabled(value);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (enabled === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e5383b" />
      </View>
    );
  }
  return enabled ? <CatalogStack /> : <CatalogComingSoonScreen />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
