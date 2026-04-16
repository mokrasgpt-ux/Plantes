import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Alert, Switch, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Plant, PlantSpecies } from '../types';
import { savePlant, loadPlants, generateId } from '../utils/storage';
import { scheduleWateringNotification, cancelNotification } from '../utils/notifications';
import { findSpeciesByKey } from '../data/plantsDatabase';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddPlant'>;
  route: RouteProp<RootStackParamList, 'AddPlant'>;
};

const LOCATIONS = ['Salon', 'Chambre', 'Cuisine', 'Salle de bain', 'Balcon', 'Jardin', 'Bureau'];

export default function AddPlantScreen({ navigation, route }: Props) {
  const editingId = route.params?.plantId;
  const [name, setName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<PlantSpecies | null>(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [wateringDays, setWateringDays] = useState(7);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifTime, setNotifTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingId) {
      loadPlants().then(plants => {
        const plant = plants.find(p => p.id === editingId);
        if (plant) {
          setName(plant.name);
          setLocation(plant.location ?? '');
          setNotes(plant.notes ?? '');
          setWateringDays(plant.wateringFrequencyDays);
          setNotifEnabled(plant.notificationEnabled);
          const t = new Date();
          t.setHours(plant.notificationHour, plant.notificationMinute, 0, 0);
          setNotifTime(t);
          const species = findSpeciesByKey(plant.species);
          if (species) setSelectedSpecies(species);
        }
      });
    }
  }, [editingId]);

  function handleSelectSpecies() {
    navigation.navigate('SelectSpecies', {
      onSelect: (species: PlantSpecies) => {
        setSelectedSpecies(species);
        if (!name) setName(species.name);
        setWateringDays(species.defaultWateringFrequencyDays);
      },
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un nom à votre plante.');
      return;
    }
    if (!selectedSpecies) {
      Alert.alert('Erreur', 'Veuillez sélectionner une espèce.');
      return;
    }
    setSaving(true);
    try {
      const plants = await loadPlants();
      const existing = editingId ? plants.find(p => p.id === editingId) : null;
      const plant: Plant = {
        id: editingId ?? generateId(),
        name: name.trim(),
        species: selectedSpecies.key,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        photos: existing?.photos ?? [],
        notes: notes.trim() || undefined,
        location: location.trim() || undefined,
        wateringFrequencyDays: wateringDays,
        lastWatered: existing?.lastWatered,
        notificationEnabled: notifEnabled,
        notificationHour: notifTime.getHours(),
        notificationMinute: notifTime.getMinutes(),
        notificationId: existing?.notificationId,
      };
      if (existing?.notificationId && !notifEnabled) {
        await cancelNotification(existing.notificationId);
        plant.notificationId = undefined;
      } else if (notifEnabled) {
        const notifId = await scheduleWateringNotification(plant);
        if (notifId) plant.notificationId = notifId;
      }
      await savePlant(plant);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la plante.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Espèce *</Text>
        <TouchableOpacity style={styles.speciesButton} onPress={handleSelectSpecies}>
          {selectedSpecies ? (
            <View style={styles.speciesSelected}>
              <Text style={styles.speciesEmoji}>{selectedSpecies.emoji}</Text>
              <View>
                <Text style={styles.speciesName}>{selectedSpecies.name}</Text>
                <Text style={styles.speciesScientific}>{selectedSpecies.scientificName}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.speciesPlaceholder}>🔍  Choisir une espèce...</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Nom de votre plante *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="ex: Mon Monstera du salon"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.sectionTitle}>Emplacement</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationRow}>
          {LOCATIONS.map(loc => (
            <TouchableOpacity
              key={loc}
              style={[styles.locationChip, location === loc && styles.locationChipActive]}
              onPress={() => setLocation(location === loc ? '' : loc)}
            >
              <Text style={[styles.locationChipText, location === loc && styles.locationChipTextActive]}>
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Notes personnelles</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Observations, particularités..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.sectionTitle}>Fréquence d'arrosage</Text>
        <View style={styles.frequencyRow}>
          <TouchableOpacity style={styles.frequencyBtn} onPress={() => setWateringDays(Math.max(1, wateringDays - 1))}>
            <Text style={styles.frequencyBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.frequencyCenter}>
            <Text style={styles.frequencyValue}>{wateringDays}</Text>
            <Text style={styles.frequencyUnit}>jour{wateringDays > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.frequencyBtn} onPress={() => setWateringDays(Math.min(90, wateringDays + 1))}>
            <Text style={styles.frequencyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notifSection}>
          <View style={styles.notifHeader}>
            <Text style={styles.sectionTitle}>Rappels d'arrosage</Text>
            <Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ false: '#ddd', true: '#2d6a4f' }} thumbColor={notifEnabled ? '#fff' : '#f4f3f4'} />
          </View>
          {notifEnabled && (
            <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.timeButtonText}>🕐 Rappel à {notifTime.getHours().toString().padStart(2, '0')}:{notifTime.getMinutes().toString().padStart(2, '0')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={notifTime}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (date) setNotifTime(date);
            }}
          />
        )}

        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Sauvegarde...' : editingId ? '✓ Mettre à jour' : '✓ Ajouter la plante'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 18, marginBottom: 8 },
  speciesButton: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#2d6a4f', borderStyle: 'dashed', padding: 14 },
  speciesSelected: { flexDirection: 'row', alignItems: 'center' },
  speciesEmoji: { fontSize: 32, marginRight: 12 },
  speciesName: { fontSize: 16, fontWeight: '700', color: '#1a472a' },
  speciesScientific: { fontSize: 12, color: '#888', fontStyle: 'italic' },
  speciesPlaceholder: { color: '#2d6a4f', fontSize: 15, textAlign: 'center', paddingVertical: 4 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#e0e0e0' },
  textArea: { minHeight: 80 },
  locationRow: { flexDirection: 'row' },
  locationChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  locationChipActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  locationChipText: { fontSize: 13, color: '#666' },
  locationChipTextActive: { color: '#fff', fontWeight: '600' },
  frequencyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', overflow: 'hidden' },
  frequencyBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9' },
  frequencyBtnText: { fontSize: 24, color: '#2d6a4f', fontWeight: '700' },
  frequencyCenter: { flex: 1, alignItems: 'center' },
  frequencyValue: { fontSize: 28, fontWeight: '800', color: '#1a472a' },
  frequencyUnit: { fontSize: 12, color: '#888' },
  notifSection: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', padding: 14, marginTop: 18 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeButton: { marginTop: 10, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 12, alignItems: 'center' },
  timeButtonText: { fontSize: 15, color: '#2d6a4f', fontWeight: '600' },
  saveButton: { marginTop: 28, backgroundColor: '#2d6a4f', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
