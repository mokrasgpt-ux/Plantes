import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, PlantSpecies } from '../types';
import { PLANTS_DATABASE, searchSpecies } from '../data/plantsDatabase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SelectSpecies'>;
  route: RouteProp<RootStackParamList, 'SelectSpecies'>;
};

export default function SelectSpeciesScreen({ navigation, route }: Props) {
  const [query, setQuery] = useState('');
  const results = query.length > 0 ? searchSpecies(query) : PLANTS_DATABASE;

  function handleSelect(species: PlantSpecies) {
    route.params.onSelect(species);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une espèce..."
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemScientific}>{item.scientificName}</Text>
              <View style={styles.row}>
                <View style={[styles.difficultyBadge, difficultyStyle(item.difficulty)]}>
                  <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
                {item.tags.slice(0, 2).map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

function difficultyStyle(difficulty: PlantSpecies['difficulty']) {
  const colors: Record<string, string> = {
    Facile: '#2d6a4f',
    Moyen: '#e9c46a',
    Difficile: '#e63946',
  };
  return { backgroundColor: colors[difficulty] + '22', borderColor: colors[difficulty] };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  searchContainer: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInput: { backgroundColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#333' },
  item: { flexDirection: 'row', padding: 14, backgroundColor: '#fff', alignItems: 'center' },
  emoji: { fontSize: 36, marginRight: 14 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1a472a' },
  itemScientific: { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  difficultyBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 4 },
  difficultyText: { fontSize: 10, fontWeight: '600', color: '#333' },
  tag: { backgroundColor: '#e8f5e9', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 4 },
  tagText: { fontSize: 10, color: '#2d6a4f' },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 64 },
});
