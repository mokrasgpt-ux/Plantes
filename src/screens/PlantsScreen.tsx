import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet, Alert, Modal,
  TextInput, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Plant } from '../types';
import { loadPlants, loadRooms, addRoom, deleteRoom } from '../utils/storage';
import { getWateringStatus } from '../utils/notifications';
import PlantCard from '../components/PlantCard';
import AppHeader from '../components/AppHeader';
import { cardShadow, palette, screenPadding } from '../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export default function PlantsScreen({ navigation }: Props) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [manageVisible, setManageVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadPlants(), loadRooms()]).then(([p, r]) => {
        setPlants(p);
        setRooms(r);
      });
    }, [])
  );

  const sections = useMemo(() => {
    const map = new Map<string, Plant[]>();
    plants.forEach(plant => {
      const key = plant.location || 'Sans piece';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(plant);
    });

    const result: Array<{ title: string; data: Plant[] }> = [];
    rooms.forEach(room => {
      const data = map.get(room);
      if (data) result.push({ title: room, data });
    });

    map.forEach((data, key) => {
      if (key === 'Sans piece') return;
      if (!rooms.includes(key)) result.push({ title: key, data });
    });

    const noRoom = map.get('Sans piece');
    if (noRoom) result.push({ title: 'Sans piece', data: noRoom });

    return result;
  }, [plants, rooms]);

  async function handleAddRoom() {
    if (!newRoomName.trim()) return;
    const updated = await addRoom(newRoomName.trim());
    setRooms(updated);
    setNewRoomName('');
  }

  async function handleDeleteRoom(name: string) {
    const used = plants.some(p => p.location === name);
    if (used) {
      Alert.alert('Piece utilisee', `Des plantes sont dans "${name}". Deplacez-les d'abord.`);
      return;
    }
    Alert.alert('Supprimer la piece', `Supprimer "${name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteRoom(name);
          setRooms(updated);
        },
      },
    ]);
  }

  const totalPlants = plants.length;
  const activeRooms = sections.filter(section => section.title !== 'Sans piece').length;
  const needsAttention = plants.filter(plant => {
    const status = getWateringStatus(plant);
    return status === 'overdue' || status === 'today';
  }).length;

  const stats = [
    { label: 'Plantes suivies', value: totalPlants, tint: palette.sky, tone: '#edf7fb' },
    { label: 'Pieces actives', value: activeRooms, tint: palette.amber, tone: '#fff3e2' },
    { label: 'A surveiller', value: needsAttention, tint: palette.terracotta, tone: '#fff0eb' },
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        theme="garden"
        eyebrow="Collection"
        title="Mes plantes"
        subtitle={totalPlants === 0 ? 'Le jardin est encore vide' : `${totalPlants} plantes en suivi`}
        rightElement={
          <TouchableOpacity style={styles.manageBtn} onPress={() => setManageVisible(true)}>
            <Text style={styles.manageBtnText}>Pieces</Text>
          </TouchableOpacity>
        }
      />

      {plants.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyKicker}>Premier pot</Text>
            <Text style={styles.emptyTitle}>Le jardin attend sa premiere plante</Text>
            <Text style={styles.emptyText}>
              Cree une plante, choisis une piece et commence a suivre son rythme.
            </Text>
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              onPress={() => navigation.navigate('PlantDetail', { plantId: item.id })}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.summaryStrip}>
              {stats.map(stat => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.tone }]}>
                  <View style={[styles.statDot, { backgroundColor: stat.tint }]} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPlant', {})}
        activeOpacity={0.9}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={manageVisible} animationType="slide" transparent onRequestClose={() => setManageVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Organisation</Text>
                <Text style={styles.modalTitle}>Pieces et reperes</Text>
              </View>
              <TouchableOpacity onPress={() => setManageVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addRoomRow}>
              <TextInput
                style={styles.addRoomInput}
                placeholder="Nom de la piece"
                placeholderTextColor="#9aa1a8"
                value={newRoomName}
                onChangeText={setNewRoomName}
                onSubmitEditing={handleAddRoom}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addRoomBtn} onPress={handleAddRoom}>
                <Text style={styles.addRoomBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={rooms}
              keyExtractor={item => item}
              ListEmptyComponent={
                <Text style={styles.noRooms}>Aucune piece creee pour le moment.</Text>
              }
              renderItem={({ item }) => {
                const count = plants.filter(p => p.location === item).length;
                return (
                  <View style={styles.roomRow}>
                    <View style={styles.roomBadge} />
                    <View style={styles.roomInfo}>
                      <Text style={styles.roomName}>{item}</Text>
                      <Text style={styles.roomCount}>{count} plante{count !== 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteRoom(item)} style={styles.roomDeleteButton}>
                      <Text style={styles.roomDelete}>Suppr.</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  summaryStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: screenPadding,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statCard: {
    flex: 1,
    minHeight: 94,
    borderRadius: 22,
    padding: 14,
    ...cardShadow,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.ink,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emptyState: {
    flex: 1,
    padding: screenPadding,
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 28,
    padding: 28,
    ...cardShadow,
  },
  emptyKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 26,
    lineHeight: 32,
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
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink,
  },
  sectionCount: {
    fontSize: 12,
    color: palette.white,
    backgroundColor: palette.garden,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.coral,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 10,
  },
  fabText: { color: palette.white, fontSize: 30, fontWeight: '300', marginTop: -2 },
  manageBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  manageBtnText: { color: palette.white, fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 18, 14, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: palette.surfaceStrong,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '72%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalTitle: { fontSize: 24, fontWeight: '800', color: palette.ink },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f3eadc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: { fontSize: 14, color: palette.ink, fontWeight: '800' },
  addRoomRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  addRoomInput: {
    flex: 1,
    backgroundColor: palette.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.ink,
    borderWidth: 1,
    borderColor: palette.border,
  },
  addRoomBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: palette.garden,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRoomBtnText: { color: palette.white, fontSize: 24, fontWeight: '300', marginTop: -2 },
  noRooms: { color: palette.inkSoft, textAlign: 'center', padding: 20 },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2e8da',
  },
  roomBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.sky,
    marginRight: 12,
  },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 16, color: palette.ink, fontWeight: '700' },
  roomCount: { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  roomDeleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff1ee',
  },
  roomDelete: { fontSize: 12, color: palette.coral, fontWeight: '800' },
});
