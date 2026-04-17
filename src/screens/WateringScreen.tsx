import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  Alert, Image, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RootStackParamList, Plant } from '../types';
import { loadPlants, savePlant, loadRooms } from '../utils/storage';
import { findSpeciesByKey } from '../data/plantsDatabase';
import {
  getNextWateringDate, getDaysUntilWatering, getWateringStatus,
  scheduleWateringNotification, cancelNotification, requestNotificationPermissions,
} from '../utils/notifications';
import AppHeader from '../components/AppHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

type WateringItem = {
  plant: Plant;
  daysUntil: number;
  status: 'overdue' | 'today' | 'soon' | 'ok';
  nextDate: Date | null;
};

function buildWateringList(plants: Plant[]): WateringItem[] {
  return plants.map(plant => ({
    plant,
    daysUntil: getDaysUntilWatering(plant),
    status: getWateringStatus(plant),
    nextDate: getNextWateringDate(plant),
  }));
}

const statusColor = {
  overdue: '#e63946',
  today: '#f4a261',
  soon: '#e9c46a',
  ok: '#2d6a4f',
};

export default function WateringScreen({ navigation }: Props) {
  const [items, setItems] = useState<WateringItem[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadPlants(), loadRooms()]).then(([plants, r]) => {
        setItems(buildWateringList(plants));
        setRooms(r);
      });
    }, [])
  );

  const sections = useMemo(() => {
    const map = new Map<string, WateringItem[]>();
    items.forEach(item => {
      const key = item.plant.location || '📦 Sans pièce';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });

    const sortItems = (list: WateringItem[]) =>
      [...list].sort((a, b) => a.daysUntil - b.daysUntil);

    const result: Array<{ title: string; data: WateringItem[] }> = [];
    rooms.forEach(room => {
      const data = map.get(room);
      if (data) result.push({ title: room, data: sortItems(data) });
    });

    map.forEach((data, key) => {
      if (key === '📦 Sans pièce') return;
      if (!rooms.includes(key)) result.push({ title: key, data: sortItems(data) });
    });

    const noRoom = map.get('📦 Sans pièce');
    if (noRoom) result.push({ title: '📦 Sans pièce', data: sortItems(noRoom) });

    return result;
  }, [items, rooms]);

  async function handleMarkWatered(plant: Plant) {
    const updated: Plant = { ...plant, lastWatered: new Date().toISOString() };
    await savePlant(updated);
    const plants = await loadPlants();
    setItems(buildWateringList(plants));
    Alert.alert('💧 Arrosage enregistré !', `${plant.name} a été arrosé.`);
  }

  async function handleToggleNotification(plant: Plant) {
    const newEnabled = !plant.notificationEnabled;
    if (newEnabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permission refusée', 'Activez les notifications dans les paramètres.');
        return;
      }
    }

    let notifId = plant.notificationId;
    if (newEnabled) {
      const id = await scheduleWateringNotification({ ...plant, notificationEnabled: true });
      notifId = id ?? undefined;
    } else if (plant.notificationId) {
      await cancelNotification(plant.notificationId);
      notifId = undefined;
    }

    const updated: Plant = { ...plant, notificationEnabled: newEnabled, notificationId: notifId };
    await savePlant(updated);
    const plants = await loadPlants();
    setItems(buildWateringList(plants));
  }

  function formatNextDate(item: WateringItem): string {
    if (!item.nextDate) return 'Jamais arrosé';
    if (item.status === 'overdue') {
      const days = Math.abs(item.daysUntil);
      return `En retard de ${days} jour${days > 1 ? 's' : ''} !`;
    }
    if (isToday(item.nextDate)) return "Aujourd'hui";
    if (isTomorrow(item.nextDate)) return 'Demain';
    return format(item.nextDate, 'EEEE d MMMM', { locale: fr });
  }

  const overdueCount = items.filter(i => i.status === 'overdue').length;
  const todayCount = items.filter(i => i.status === 'today').length;

  return (
    <View style={styles.container}>
      <AppHeader
        title="💧 Arrosage"
        subtitle={
          overdueCount > 0
            ? `🚨 ${overdueCount} en retard`
            : todayCount > 0
            ? `💧 ${todayCount} à arroser aujourd'hui`
            : `${items.length} plante${items.length !== 1 ? 's' : ''}`
        }
      />

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💧</Text>
          <Text style={styles.emptyTitle}>Aucune plante</Text>
          <Text style={styles.emptyText}>
            Ajoutez des plantes dans l'onglet "Mes Plantes".
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.plant.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const species = findSpeciesByKey(item.plant.species);
            const latestPhoto = item.plant.photos[item.plant.photos.length - 1];
            const color = statusColor[item.status];

            return (
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => navigation.navigate('PlantDetail', { plantId: item.plant.id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.photoContainer}>
                    {latestPhoto ? (
                      <Image source={{ uri: latestPhoto.uri }} style={styles.photo} />
                    ) : (
                      <View style={[styles.photoPlaceholder, { backgroundColor: color + '22' }]}>
                        <Text style={styles.photoEmoji}>{species?.emoji ?? '🌱'}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.plantName} numberOfLines={1}>{item.plant.name}</Text>
                    <Text style={styles.speciesName} numberOfLines={1}>
                      {species?.name ?? item.plant.species}
                    </Text>
                    <View style={[styles.nextBadge, { backgroundColor: color + '22', borderColor: color }]}>
                      <Text style={[styles.nextBadgeText, { color }]}>
                        💧 {formatNextDate(item)}
                      </Text>
                    </View>
                    <Text style={styles.frequencyText}>
                      Tous les {item.plant.wateringFrequencyDays} jour{item.plant.wateringFrequencyDays > 1 ? 's' : ''}
                    </Text>
                    {item.plant.lastWatered && (
                      <Text style={styles.lastWateredText}>
                        Dernier : {format(new Date(item.plant.lastWatered), 'd MMM', { locale: fr })}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.waterNowBtn, { backgroundColor: color }]}
                    onPress={() => handleMarkWatered(item.plant)}
                  >
                    <Text style={styles.waterNowText}>💧</Text>
                  </TouchableOpacity>
                  <View style={styles.notifRow}>
                    <Text style={styles.notifLabel}>🔔</Text>
                    <Switch
                      value={item.plant.notificationEnabled}
                      onValueChange={() => handleToggleNotification(item.plant)}
                      trackColor={{ false: '#ddd', true: '#2d6a4f' }}
                      thumbColor="#fff"
                      style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                    />
                  </View>
                  {item.plant.notificationEnabled && (
                    <Text style={styles.notifTime}>
                      {item.plant.notificationHour.toString().padStart(2, '0')}:
                      {item.plant.notificationMinute.toString().padStart(2, '0')}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2d6a4f', flex: 1 },
  sectionCount: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#2d6a4f',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    marginHorizontal: 16, marginVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', padding: 12 },
  photoContainer: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', marginRight: 12 },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  photoEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  plantName: { fontSize: 15, fontWeight: '700', color: '#1a472a' },
  speciesName: { fontSize: 11, color: '#888', fontStyle: 'italic', marginBottom: 4 },
  nextBadge: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: 4,
  },
  nextBadgeText: { fontSize: 11, fontWeight: '700' },
  frequencyText: { fontSize: 11, color: '#aaa' },
  lastWateredText: { fontSize: 11, color: '#aaa' },
  cardActions: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10, paddingTop: 2,
    borderTopWidth: 1, borderTopColor: '#f5f5f0', gap: 8,
  },
  waterNowBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  waterNowText: { fontSize: 18 },
  notifRow: { flexDirection: 'row', alignItems: 'center' },
  notifLabel: { fontSize: 16 },
  notifTime: { fontSize: 11, color: '#888', marginLeft: 2 },
});
