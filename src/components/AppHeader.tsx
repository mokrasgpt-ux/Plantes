import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export default function AppHeader({ title, subtitle, rightElement }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.banner, { paddingTop: insets.top + 14 }]}>
      <View style={styles.inner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#a8d5ba',
    marginTop: 2,
  },
});
