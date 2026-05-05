import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderThemeName, headerThemes } from '../theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  eyebrow?: string;
  theme?: HeaderThemeName;
}

export default function AppHeader({
  title,
  subtitle,
  rightElement,
  eyebrow,
  theme = 'garden',
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = headerThemes[theme];
  return (
    <View style={[styles.banner, { backgroundColor: colors.background, paddingTop: insets.top + 14 }]}>
      <View style={[styles.glow, { backgroundColor: colors.glow }]} />
      <View style={[styles.orbLarge, { backgroundColor: colors.orbA }]} />
      <View style={[styles.orbSmall, { backgroundColor: colors.orbB }]} />
      <View style={styles.inner}>
        <View style={{ flex: 1 }}>
          {eyebrow ? <Text style={[styles.eyebrow, { color: colors.subtitle }]}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.subtitle }]}>{subtitle}</Text> : null}
        </View>
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -64,
    right: -36,
    opacity: 0.46,
  },
  orbLarge: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    top: 36,
    right: 18,
    opacity: 0.16,
  },
  orbSmall: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    top: 78,
    right: 118,
    opacity: 0.22,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
