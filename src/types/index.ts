export interface PlantPhoto {
  id: string;
  uri: string;
  date: string; // ISO string
  note?: string;
}

export interface Plant {
  id: string;
  name: string;         // Custom name given by user
  species: string;      // Species key from database
  createdAt: string;    // ISO string
  photos: PlantPhoto[];
  notes?: string;
  location?: string;    // e.g. "Salon", "Balcon"
  wateringFrequencyDays: number;
  lastWatered?: string; // ISO string
  notificationEnabled: boolean;
  notificationHour: number;   // 0-23
  notificationMinute: number; // 0-59
  notificationId?: string;
}

export interface PlantSpecies {
  key: string;
  name: string;         // Common name in French
  scientificName: string;
  emoji: string;
  description: string;
  wateringAdvice: string;
  lightAdvice: string;
  humidityAdvice: string;
  temperatureAdvice: string;
  fertilizingAdvice: string;
  commonIssues: string;
  defaultWateringFrequencyDays: number;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  tags: string[];
}

export type RootStackParamList = {
  MainTabs: undefined;
  PlantDetail: { plantId: string };
  AddPlant: { plantId?: string };
  AddPhoto: { plantId: string };
  SelectSpecies: { onSelect: (species: PlantSpecies) => void };
};

export type TabParamList = {
  Plants: undefined;
  Watering: undefined;
  Species: undefined;
};
