import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Plant } from '../types';
import { loadPlants, deletePlant } from '../utils/storage';
import { cancelNotification } from '../utils/notifications';
import PlantCard from '../components/PlantCard';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export default function PlantsScreen({ navigation }: Props) {
  const [plants, setPlants] = useState<Plant[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPlants().then(setPlants);
    }, [])
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌿 Mes Plantes</Text>
        <Text style={styles.headerSub}>
          {plants.length === 0
            ? 'Aucune plante pour le moment'
            : `${plants.length} plante${plants.length > 1 ? 's' : ''}`}
        </Text>
      </View>

      {plants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>Votre jardin est vide</Text>
          <Text style={styles.emptyText}>
            Commencez par ajouter votre première plante en appuyant sur le bouton +
          </Text>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              onPress={() => navigation.navigate('PlantDetail', { plantId: item.id })}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPlant', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#f5f5f0' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1a472a' },
  headerSub: { fontSize: 14, color: '#888', marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#2d6a4f', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
