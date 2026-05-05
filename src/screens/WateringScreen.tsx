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
import { cardShadow, palette, screenPadding, statusThemes } from '../theme/tokens';

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
      const key = item.plant.location || 'Sans piece';
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
      if (key === 'Sans piece') return;
      if (!rooms.includes(key)) result.push({ title: key, data: sortItems(data) });
    });

    const noRoom = map.get('Sans piece');
    if (noRoom) result.push({ title: 'Sans piece', data: sortItems(noRoom) });

    return result;
  }, [items, rooms]);

  async function handleMarkWatered(plant: Plant) {
    const updated: Plant = { ...plant, lastWatered: new Date().toISOString() };
    await savePlant(updated);
    const plants = await loadPlants();
    setItems(buildWateringList(plants));
    Alert.alert('Arrosage enregistre', `${plant.name} a ete mis a jour.`);
  }

  async function handleToggleNotification(plant: Plant) {
    const newEnabled = !plant.notificationEnabled;
    if (newEnabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permission refusee', 'Active les notifications dans les parametres.');
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
    if (!item.nextDate) return 'Jamais arrose';
    if (item.status === 'overdue') {
      const days = Math.abs(item.daysUntil);
      return `En retard de ${days} jour${days > 1 ? 's' : ''}`;
    }
    if (isToday(item.nextDate)) return 'Aujourd hui';
    if (isTomorrow(item.nextDate)) return 'Demain';
    return format(item.nextDate, 'EEEE d MMMM', { locale: fr });
  }

  const overdueCount = items.filter(i => i.status === 'overdue').length;
  const todayCount = items.filter(i => i.status === 'today').length;
  const soonCount = items.filter(i => i.status === 'soon').length;
  const okCount = items.filter(i => i.status === 'ok').length;

  const stats = [
    { key: 'overdue', label: 'Urgent', value: overdueCount, surface: statusThemes.overdue.surface, color: statusThemes.overdue.color },
    { key: 'today', label: 'Aujourd hui', value: todayCount, surface: statusThemes.today.surface, color: statusThemes.today.color },
    { key: 'soon', label: 'Bientot', value: soonCount, surface: statusThemes.soon.surface, color: statusThemes.soon.color },
    { key: 'ok', label: 'Stables', value: okCount, surface: statusThemes.ok.surface, color: statusThemes.ok.color },
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        theme="night"
        eyebrow="Control room"
        title="Rythme d arrosage"
        subtitle={
          overdueCount > 0
            ? `${overdueCount} plantes demandent une action`
            : todayCount > 0
            ? `${todayCount} plantes a arroser aujourd hui`
            : `${items.length} plantes dans le radar`
        }
      />

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyKicker}>Suivi</Text>
            <Text style={styles.emptyTitle}>Aucune plante a surveiller</Text>
            <Text style={styles.emptyText}>
              Ajoute des plantes dans l onglet principal pour lancer le rythme d arrosage.
            </Text>
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.plant.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View>
              <View style={styles.summaryGrid}>
                {stats.map(stat => (
                  <View key={stat.key} style={[styles.statCard, { backgroundColor: stat.surface }]}>
                    <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.introCard}>
                <View style={styles.introBar} />
                <View style={styles.introTextWrap}>
                  <Text style={styles.introTitle}>Lecture rapide</Text>
                  <Text style={styles.introText}>
                    Les cartes les plus chaudes sont celles a traiter d abord. La couleur raconte l urgence.
                  </Text>
                </View>
              </View>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const species = findSpeciesByKey(item.plant.species);
            const latestPhoto = item.plant.photos[item.plant.photos.length - 1];
            const theme = statusThemes[item.status];

            return (
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={[styles.cardAccent, { backgroundColor: theme.accent }]} />
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => navigation.navigate('PlantDetail', { plantId: item.plant.id })}
                  activeOpacity={0.88}
                >
                  <View style={styles.photoContainer}>
                    {latestPhoto ? (
                      <Image source={{ uri: latestPhoto.uri }} style={styles.photo} />
                    ) : (
                      <View style={[styles.photoPlaceholder, { backgroundColor: '#ffffffaa' }]}>
                        <Text style={styles.photoEmoji}>{species?.emoji ?? 'PL'}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.infoTopRow}>
                      <View style={styles.nameWrap}>
                        <Text style={styles.plantName} numberOfLines={1}>{item.plant.name}</Text>
                        <Text style={styles.speciesName} numberOfLines={1}>
                          {species?.name ?? item.plant.species}
                        </Text>
                      </View>
                      <View style={[styles.levelPill, { borderColor: theme.color }]}>
                        <Text style={[styles.levelText, { color: theme.color }]}>{theme.label}</Text>
                      </View>
                    </View>

                    <Text style={[styles.nextLine, { color: theme.color }]}>
                      {formatNextDate(item)}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>
                        Tous les {item.plant.wateringFrequencyDays} jour{item.plant.wateringFrequencyDays > 1 ? 's' : ''}
                      </Text>
                      {item.plant.lastWatered ? (
                        <Text style={styles.metaText}>
                          Dernier {format(new Date(item.plant.lastWatered), 'd MMM', { locale: fr })}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.waterNowBtn, { backgroundColor: theme.color }]}
                    onPress={() => handleMarkWatered(item.plant)}
                  >
                    <Text style={styles.waterNowText}>Arrosee</Text>
                  </TouchableOpacity>
                  <View style={styles.notifBlock}>
                    <View style={styles.notifRow}>
                      <Text style={styles.notifLabel}>Rappel</Text>
                      <Switch
                        value={item.plant.notificationEnabled}
                        onValueChange={() => handleToggleNotification(item.plant)}
                        trackColor={{ false: '#d4cabd', true: theme.color }}
                        thumbColor="#fff"
                        style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
                      />
                    </View>
                    <Text style={styles.notifTime}>
                      {item.plant.notificationEnabled
                        ? `${item.plant.notificationHour.toString().padStart(2, '0')}:${item.plant.notificationMinute.toString().padStart(2, '0')}`
                        : 'Desactive'}
                    </Text>
                  </View>
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
  container: { flex: 1, backgroundColor: palette.background },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: screenPadding,
    paddingTop: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 22,
    padding: 16,
    minHeight: 92,
    ...cardShadow,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: palette.inkSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: screenPadding,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: palette.surfaceStrong,
    borderRadius: 22,
    overflow: 'hidden',
    ...cardShadow,
  },
  introBar: {
    width: 10,
    backgroundColor: palette.sky,
  },
  introTextWrap: {
    flex: 1,
    padding: 16,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.ink,
    marginBottom: 4,
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.inkSoft,
  },
  emptyState: { flex: 1, padding: screenPadding, justifyContent: 'center' },
  emptyCard: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 28,
    padding: 28,
    ...cardShadow,
  },
  emptyKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.sky,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    color: palette.ink,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 24,
    color: palette.inkSoft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: palette.ink },
  sectionCount: {
    fontSize: 12,
    color: palette.white,
    backgroundColor: palette.night,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
    fontWeight: '700',
  },
  card: {
    marginHorizontal: screenPadding,
    marginVertical: 6,
    borderRadius: 24,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardAccent: {
    height: 8,
  },
  cardMain: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  photoContainer: { width: 82, height: 82, marginRight: 12 },
  photo: { width: '100%', height: '100%', borderRadius: 18 },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 30 },
  cardInfo: { flex: 1 },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  nameWrap: { flex: 1 },
  plantName: { fontSize: 17, fontWeight: '800', color: palette.ink, marginBottom: 3 },
  speciesName: { fontSize: 12, color: palette.inkSoft, fontStyle: 'italic', marginBottom: 8 },
  levelPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffffb8',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  nextLine: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 11,
    color: palette.inkSoft,
    backgroundColor: '#ffffffb8',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  waterNowBtn: {
    minWidth: 108,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterNowText: { color: palette.white, fontSize: 13, fontWeight: '800' },
  notifBlock: {
    flex: 1,
    backgroundColor: '#ffffffb3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifLabel: { fontSize: 12, fontWeight: '800', color: palette.ink },
  notifTime: { fontSize: 11, color: palette.inkSoft, marginTop: 2 },
});
