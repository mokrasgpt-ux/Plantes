import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Alert, Modal, TextInput, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RootStackParamList, Plant, PlantPhoto } from '../types';
import { savePlant, loadPlants, deletePlant, generateId } from '../utils/storage';
import { findSpeciesByKey } from '../data/plantsDatabase';
import { cancelNotification } from '../utils/notifications';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlantDetail'>;
  route: RouteProp<RootStackParamList, 'PlantDetail'>;
};

const { width } = Dimensions.get('window');

export default function PlantDetailScreen({ navigation, route }: Props) {
  const { plantId } = route.params;
  const [plant, setPlant] = useState<Plant | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PlantPhoto | null>(null);
  const [photoNoteModal, setPhotoNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState<'photos' | 'infos'>('photos');

  useFocusEffect(
    useCallback(() => {
      loadPlants().then(plants => {
        const found = plants.find(p => p.id === plantId);
        if (found) setPlant(found);
        else navigation.goBack();
      });
    }, [plantId])
  );

  const species = plant ? findSpeciesByKey(plant.species) : null;

  async function copyPhotoToAppDir(uri: string): Promise<string> {
    const dir = FileSystem.documentDirectory + 'photos/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const filename = generateId() + '.jpg';
    const dest = dir + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  }

  async function handleAddPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la galerie nécessaire.');
      return;
    }
    Alert.alert('Ajouter une photo', 'Choisissez une source', [
      {
        text: 'Galerie',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [4, 3] });
          if (!result.canceled && result.assets[0]) await savePhoto(result.assets[0].uri);
        },
      },
      {
        text: 'Appareil photo',
        onPress: async () => {
          const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
          if (camStatus !== 'granted') { Alert.alert('Permission refusée', 'Accès à l\'appareil photo nécessaire.'); return; }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] });
          if (!result.canceled && result.assets[0]) await savePhoto(result.assets[0].uri);
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  async function savePhoto(uri: string) {
    if (!plant) return;
    try {
      const savedUri = await copyPhotoToAppDir(uri);
      const photo: PlantPhoto = { id: generateId(), uri: savedUri, date: new Date().toISOString() };
      const updated: Plant = { ...plant, photos: [...plant.photos, photo] };
      await savePlant(updated);
      setPlant(updated);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la photo.');
    }
  }

  function handlePhotoLongPress(photo: PlantPhoto) {
    Alert.alert('Photo', 'Que voulez-vous faire ?', [
      { text: '✏️ Ajouter/modifier une note', onPress: () => { setSelectedPhoto(photo); setNoteText(photo.note ?? ''); setPhotoNoteModal(true); } },
      { text: '🗑️ Supprimer', style: 'destructive', onPress: () => deletePhoto(photo.id) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  async function deletePhoto(photoId: string) {
    if (!plant) return;
    const photo = plant.photos.find(p => p.id === photoId);
    if (photo) { try { await FileSystem.deleteAsync(photo.uri, { idempotent: true }); } catch {} }
    const updated: Plant = { ...plant, photos: plant.photos.filter(p => p.id !== photoId) };
    await savePlant(updated);
    setPlant(updated);
  }

  async function savePhotoNote() {
    if (!plant || !selectedPhoto) return;
    const updated: Plant = { ...plant, photos: plant.photos.map(p => p.id === selectedPhoto.id ? { ...p, note: noteText.trim() || undefined } : p) };
    await savePlant(updated);
    setPlant(updated);
    setPhotoNoteModal(false);
    setSelectedPhoto(null);
  }

  async function handleMarkWatered() {
    if (!plant) return;
    const updated: Plant = { ...plant, lastWatered: new Date().toISOString() };
    await savePlant(updated);
    setPlant(updated);
    Alert.alert('Super !', `${plant.name} a été arrosé ! 💧`);
  }

  async function handleDelete() {
    if (!plant) return;
    Alert.alert('Supprimer', `Supprimer "${plant.name}" définitivement ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          if (plant.notificationId) await cancelNotification(plant.notificationId);
          for (const photo of plant.photos) { try { await FileSystem.deleteAsync(photo.uri, { idempotent: true }); } catch {} }
          await deletePlant(plant.id);
          navigation.goBack();
        },
      },
    ]);
  }

  if (!plant) return null;
  const sortedPhotos = [...plant.photos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          {plant.photos.length > 0 ? (
            <Image source={{ uri: sortedPhotos[0].uri }} style={styles.headerImage} />
          ) : (
            <View style={styles.headerImagePlaceholder}>
              <Text style={styles.headerEmoji}>{species?.emoji ?? '🌱'}</Text>
            </View>
          )}
          <View style={styles.headerOverlay}>
            <Text style={styles.plantName}>{plant.name}</Text>
            <Text style={styles.speciesName}>{species?.name ?? plant.species}</Text>
            {plant.location && <Text style={styles.location}>📍 {plant.location}</Text>}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.waterBtn} onPress={handleMarkWatered}>
            <Text style={styles.waterBtnText}>💧 Arroser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('AddPlant', { plantId: plant.id })}>
            <Text style={styles.editBtnText}>✏️ Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {plant.lastWatered && (
          <View style={styles.wateringInfo}>
            <Text style={styles.wateringInfoText}>💧 Dernier arrosage : {format(new Date(plant.lastWatered), 'EEEE d MMMM à HH:mm', { locale: fr })}</Text>
          </View>
        )}

        <View style={styles.tabsRow}>
          <TouchableOpacity style={[styles.tab, activeTab === 'photos' && styles.tabActive]} onPress={() => setActiveTab('photos')}>
            <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>📸 Photos ({plant.photos.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'infos' && styles.tabActive]} onPress={() => setActiveTab('infos')}>
            <Text style={[styles.tabText, activeTab === 'infos' && styles.tabTextActive]}>🌿 Conseils</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'photos' ? (
          <View style={styles.photosSection}>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
              <Text style={styles.addPhotoBtnText}>+ Ajouter une photo</Text>
            </TouchableOpacity>
            {sortedPhotos.length === 0 ? (
              <View style={styles.noPhotos}>
                <Text style={styles.noPhotosEmoji}>📷</Text>
                <Text style={styles.noPhotosText}>Aucune photo pour l'instant</Text>
                <Text style={styles.noPhotosSubText}>Prenez votre première photo pour commencer à suivre l'évolution de votre plante</Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {sortedPhotos.map((photo, index) => (
                  <TouchableOpacity key={photo.id} style={styles.timelineItem} onLongPress={() => handlePhotoLongPress(photo)} activeOpacity={0.9}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.dot, index === 0 && styles.dotActive]} />
                      {index < sortedPhotos.length - 1 && <View style={styles.line} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineDate}>{format(new Date(photo.date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</Text>
                      <Image source={{ uri: photo.uri }} style={styles.timelinePhoto} />
                      {photo.note && <View style={styles.noteBox}><Text style={styles.noteText}>📝 {photo.note}</Text></View>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.infosSection}>
            {species ? (
              <>
                <Text style={styles.description}>{species.description}</Text>
                <InfoCard icon="💧" title="Arrosage" text={species.wateringAdvice} />
                <InfoCard icon="☀️" title="Lumière" text={species.lightAdvice} />
                <InfoCard icon="💨" title="Humidité" text={species.humidityAdvice} />
                <InfoCard icon="🌡️" title="Température" text={species.temperatureAdvice} />
                <InfoCard icon="🌱" title="Fertilisation" text={species.fertilizingAdvice} />
                <InfoCard icon="⚠️" title="Problèmes courants" text={species.commonIssues} />
                <View style={styles.difficultyRow}>
                  <Text style={styles.difficultyLabel}>Difficulté : </Text>
                  <Text style={styles.difficultyValue}>{species.difficulty}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.noInfoText}>Espèce inconnue — aucune information disponible.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={photoNoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Note pour cette photo</Text>
            <TextInput style={styles.noteInput} value={noteText} onChangeText={setNoteText} placeholder="Observations, traitement appliqué..." placeholderTextColor="#aaa" multiline numberOfLines={4} textAlignVertical="top" autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPhotoNoteModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={savePhotoNote}>
                <Text style={styles.modalSaveText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{icon} {title}</Text>
      <Text style={styles.infoCardText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  headerContainer: { height: 220, position: 'relative' },
  headerImage: { width: '100%', height: 220 },
  headerImagePlaceholder: { width: '100%', height: 220, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  headerEmoji: { fontSize: 72 },
  headerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.45)' },
  plantName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  speciesName: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
  location: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  actionsRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  waterBtn: { flex: 1, backgroundColor: '#2d6a4f', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  waterBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  editBtn: { flex: 1, backgroundColor: '#e8f5e9', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2d6a4f' },
  editBtnText: { color: '#2d6a4f', fontWeight: '700', fontSize: 14 },
  deleteBtn: { width: 44, backgroundColor: '#fde8e8', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e63946' },
  deleteBtnText: { fontSize: 18 },
  wateringInfo: { backgroundColor: '#e8f5e9', paddingHorizontal: 16, paddingVertical: 8 },
  wateringInfoText: { fontSize: 13, color: '#2d6a4f' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#2d6a4f' },
  tabText: { fontSize: 13, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#2d6a4f' },
  photosSection: { padding: 16 },
  addPhotoBtn: { backgroundColor: '#2d6a4f', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  addPhotoBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  noPhotos: { alignItems: 'center', padding: 30 },
  noPhotosEmoji: { fontSize: 48, marginBottom: 12 },
  noPhotosText: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 6 },
  noPhotosSubText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineLeft: { width: 24, alignItems: 'center', paddingTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#aaa' },
  dotActive: { backgroundColor: '#2d6a4f', width: 12, height: 12 },
  line: { flex: 1, width: 2, backgroundColor: '#ddd', marginTop: 4 },
  timelineContent: { flex: 1, marginLeft: 12, marginBottom: 8 },
  timelineDate: { fontSize: 12, color: '#888', marginBottom: 6 },
  timelinePhoto: { width: '100%', height: (width - 80) * 0.75, borderRadius: 12, backgroundColor: '#eee' },
  noteBox: { marginTop: 6, backgroundColor: '#fff9e6', borderRadius: 8, padding: 8, borderLeftWidth: 3, borderLeftColor: '#f4a261' },
  noteText: { fontSize: 13, color: '#666', lineHeight: 18 },
  infosSection: { padding: 16 },
  description: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: '#1a472a', marginBottom: 6 },
  infoCardText: { fontSize: 13, color: '#555', lineHeight: 20 },
  difficultyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  difficultyLabel: { fontSize: 14, fontWeight: '700', color: '#1a472a' },
  difficultyValue: { fontSize: 14, color: '#2d6a4f', fontWeight: '700' },
  noInfoText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1a472a', marginBottom: 12 },
  noteInput: { backgroundColor: '#f5f5f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', minHeight: 90, marginBottom: 16, borderWidth: 1, borderColor: '#ddd' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { color: '#666', fontWeight: '600' },
  modalSaveBtn: { flex: 1, backgroundColor: '#2d6a4f', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
