import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant } from '../types';

const PLANTS_KEY = '@plants_v1';
const ROOMS_KEY = '@rooms_v1';

export async function loadPlants(): Promise<Plant[]> {
  try {
    const json = await AsyncStorage.getItem(PLANTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function savePlants(plants: Plant[]): Promise<void> {
  await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(plants));
}

export async function savePlant(plant: Plant): Promise<Plant[]> {
  const plants = await loadPlants();
  const index = plants.findIndex(p => p.id === plant.id);
  if (index >= 0) {
    plants[index] = plant;
  } else {
    plants.push(plant);
  }
  await savePlants(plants);
  return plants;
}

export async function deletePlant(plantId: string): Promise<Plant[]> {
  const plants = await loadPlants();
  const filtered = plants.filter(p => p.id !== plantId);
  await savePlants(filtered);
  return filtered;
}

export async function getPlant(plantId: string): Promise<Plant | undefined> {
  const plants = await loadPlants();
  return plants.find(p => p.id === plantId);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function loadRooms(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(ROOMS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveRooms(rooms: string[]): Promise<void> {
  await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export async function addRoom(name: string): Promise<string[]> {
  const rooms = await loadRooms();
  const trimmed = name.trim();
  if (!trimmed || rooms.includes(trimmed)) return rooms;
  const updated = [...rooms, trimmed];
  await saveRooms(updated);
  return updated;
}

export async function deleteRoom(name: string): Promise<string[]> {
  const rooms = await loadRooms();
  const updated = rooms.filter(r => r !== name);
  await saveRooms(updated);
  return updated;
}
