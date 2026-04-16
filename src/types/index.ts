export interface PlantPhoto {
  id: string;
  uri: string;
  date: string;
  note?: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  createdAt: string;
  photos: PlantPhoto[];
  notes?: string;
  location?: string;
  wateringFrequencyDays: number;
  lastWatered?: string;
  notificationEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
  notificationId?: string;
}

export interface PlantSpecies {
  key: string;
  name: string;
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
};
