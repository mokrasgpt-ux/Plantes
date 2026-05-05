import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Plant } from '../types';
import { findSpeciesByKey } from '../data/plantsDatabase';
import { getDaysUntilWatering, getWateringStatus } from '../utils/notifications';
import { cardShadow, palette, statusThemes } from '../theme/tokens';

interface Props {
  plant: Plant;
  onPress: () => void;
}

export default function PlantCard({ plant, onPress }: Props) {
  const species = findSpeciesByKey(plant.species);
  const latestPhoto = plant.photos[plant.photos.length - 1];
  const daysUntil = getDaysUntilWatering(plant);
  const status = getWateringStatus(plant);
  const theme = statusThemes[status];

  const statusLabel = {
    overdue: `En retard de ${Math.abs(daysUntil)}j`,
    today: 'A arroser',
    soon: `Dans ${daysUntil}j`,
    ok: `Dans ${daysUntil}j`,
  }[status];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
      <View style={styles.photoContainer}>
        {latestPhoto ? (
          <Image source={{ uri: latestPhoto.uri }} style={styles.photo} />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: theme.surface }]}>
            <Text style={styles.emoji}>{species?.emoji ?? 'PL'}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>{plant.name}</Text>
            <Text style={styles.species} numberOfLines={1}>
              {species?.name ?? plant.species}
            </Text>
          </View>
          {plant.photos.length > 0 ? (
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>{plant.photos.length} photos</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.wateringBadge, { backgroundColor: theme.surface, borderColor: theme.color }]}>
            <Text style={[styles.wateringText, { color: theme.color }]}>
              {theme.label} · {statusLabel}
            </Text>
          </View>
          {plant.location ? (
            <View style={styles.locationPill}>
              <Text style={styles.locationText}>{plant.location}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceStrong,
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 7,
    overflow: 'hidden',
    ...cardShadow,
  },
  accentBar: {
    width: 8,
  },
  photoContainer: {
    width: 92,
    height: 118,
    paddingVertical: 10,
    paddingLeft: 10,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 34,
  },
  info: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink,
    marginBottom: 3,
  },
  species: {
    fontSize: 12,
    color: palette.inkSoft,
    fontStyle: 'italic',
  },
  photoBadge: {
    backgroundColor: '#f3eadc',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoBadgeText: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    marginTop: 12,
    gap: 8,
  },
  wateringBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  wateringText: {
    fontSize: 11,
    fontWeight: '800',
  },
  locationPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef1f4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationText: {
    fontSize: 11,
    color: palette.inkSoft,
    fontWeight: '700',
  },
});
