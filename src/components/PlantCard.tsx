import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Plant } from '../types';
import { findSpeciesByKey } from '../data/plantsDatabase';
import { getDaysUntilWatering, getWateringStatus } from '../utils/notifications';

interface Props {
  plant: Plant;
  onPress: () => void;
}

export default function PlantCard({ plant, onPress }: Props) {
  const species = findSpeciesByKey(plant.species);
  const latestPhoto = plant.photos[plant.photos.length - 1];
  const daysUntil = getDaysUntilWatering(plant);
  const status = getWateringStatus(plant);

  const statusColor = {
    overdue: '#e63946',
    today: '#f4a261',
    soon: '#e9c46a',
    ok: '#2d6a4f',
  }[status];

  const statusLabel = {
    overdue: `En retard de ${Math.abs(daysUntil)}j`,
    today: "Aujourd'hui !",
    soon: `Dans ${daysUntil}j`,
    ok: `Dans ${daysUntil}j`,
  }[status];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.photoContainer}>
        {latestPhoto ? (
          <Image source={{ uri: latestPhoto.uri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.emoji}>{species?.emoji ?? '🌱'}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{plant.name}</Text>
        <Text style={styles.species} numberOfLines={1}>
          {species?.name ?? plant.species}
        </Text>
        {plant.location ? (
          <Text style={styles.location}>📍 {plant.location}</Text>
        ) : null}
        <View style={[styles.wateringBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
          <Text style={[styles.wateringText, { color: statusColor }]}>
            💧 {statusLabel}
          </Text>
        </View>
      </View>
      {plant.photos.length > 0 && (
        <View style={styles.photoBadge}>
          <Text style={styles.photoBadgeText}>📸 {plant.photos.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  photoContainer: { width: 90, height: 110 },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 36 },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#1a472a', marginBottom: 2 },
  species: { fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 4 },
  location: { fontSize: 12, color: '#888', marginBottom: 6 },
  wateringBadge: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  wateringText: { fontSize: 11, fontWeight: '600' },
  photoBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  photoBadgeText: { color: '#fff', fontSize: 10 },
});
