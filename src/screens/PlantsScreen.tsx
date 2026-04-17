import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet, Alert, Modal,
  TextInput, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Plant } from '../types';
import { loadPlants, deletePlant, loadRooms, addRoom, deleteRoom } from '../utils/storage';
import { cancelNotification } from '../utils/notifications';
import PlantCard from '../components/PlantCard';
import AppHeader from '../components/AppHeader';

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
      const key = plant.location || '📦 Sans pièce';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(plant);
    });

    const result: Array<{ title: string; data: Plant[] }> = [];
    rooms.forEach(room => {
      const data = map.get(room);
      if (data) result.push({ title: room, data });
    });

    map.forEach((data, key) => {
      if (key === '📦 Sans pièce') return;
      if (!rooms.includes(key)) result.push({ title: key, data });
    });

    const noRoom = map.get('📦 Sans pièce');
    if (noRoom) result.push({ title: '📦 Sans pièce', data: noRoom });

    return result;
  }, [plants, rooms]);

  function handleDelete(plant: Plant) {
    Alert.alert(
      'Supprimer la plante',
      `Supprimer "${plant.name}" et toutes ses photos ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (plant.notificationId) await cancelNotification(plant.notificationId);
            const updated = await deletePlant(plant.id);
            setPlants(updated);
          },
        },
      ]
    );
  }

  async function handleAddRoom() {
    if (!newRoomName.trim()) return;
    const updated = await addRoom(newRoomName.trim());
    setRooms(updated);
    setNewRoomName('');
  }

  async function handleDeleteRoom(name: string) {
    const used = plants.some(p => p.location === name);
    if (used) {
      Alert.alert('Pièce utilisée', `Des plantes sont dans "${name}". Déplacez-les d'abord.`);
      return;
    }
    Alert.alert('Supprimer la pièce', `Supprimer "${name}" ?`, [
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

  return (
    <View style={styles.container}>
      <AppHeader
        title="🌿 Mes Plantes"
        subtitle={totalPlants === 0 ? 'Aucune plante' : `${totalPlants} plante${totalPlants > 1 ? 's' : ''}`}
        rightElement={
          <TouchableOpacity style={styles.manageBtn} onPress={() => setManageVisible(true)}>
            <Text style={styles.manageBtnText}>🏠 Pièces</Text>
          </TouchableOpacity>
        }
      />

      {plants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>Votre jardin est vide</Text>
          <Text style={styles.emptyText}>
            Appuyez sur + pour ajouter votre première plante
          </Text>
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
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPlant', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={manageVisible} animationType="slide" transparent onRequestClose={() => setManageVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏠 Gérer les pièces</Text>
              <TouchableOpacity onPress={() => setManageVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addRoomRow}>
              <TextInput
                style={styles.addRoomInput}
                placeholder="Nom de la pièce..."
                placeholderTextColor="#aaa"
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
                <Text style={styles.noRooms}>Aucune pièce créée. Ajoutez-en une ci-dessus.</Text>
              }
              renderItem={({ item }) => {
                const count = plants.filter(p => p.location === item).length;
                return (
                  <View style={styles.roomRow}>
                    <Text style={styles.roomName}>{item}</Text>
                    <Text style={styles.roomCount}>{count} plante{count !== 1 ? 's' : ''}</Text>
                    <TouchableOpacity onPress={() => handleDeleteRoom(item)}>
                      <Text style={styles.roomDelete}>🗑️</Text>
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
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  manageBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  manageBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a472a' },
  modalClose: { fontSize: 18, color: '#888', padding: 4 },
  addRoomRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  addRoomInput: {
    flex: 1,
    backgroundColor: '#f5f5f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addRoomBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRoomBtnText: { color: '#fff', fontSize: 24, fontWeight: '300', marginTop: -2 },
  noRooms: { color: '#aaa', textAlign: 'center', padding: 20 },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomName: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  roomCount: { fontSize: 12, color: '#888', marginRight: 12 },
  roomDelete: { fontSize: 18, padding: 4 },
});
