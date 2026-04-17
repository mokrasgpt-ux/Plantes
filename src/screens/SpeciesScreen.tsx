import React, { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Modal, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlantSpecies } from '../types';
import { PLANTS_DATABASE, searchSpecies } from '../data/plantsDatabase';
import AppHeader from '../components/AppHeader';

const difficultyColors: Record<string, string> = {
  Facile: '#2d6a4f',
  Moyen: '#e9a010',
  Difficile: '#e63946',
};

function DifficultyBadge({ difficulty }: { difficulty: PlantSpecies['difficulty'] }) {
  const color = difficultyColors[difficulty] ?? '#888';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{difficulty}</Text>
    </View>
  );
}

function InfoRow({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

function SpeciesDetail({ species, onClose }: { species: PlantSpecies; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.detailContainer, { paddingTop: insets.top }]}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>← Retour</Text>
        </TouchableOpacity>
        <DifficultyBadge difficulty={species.difficulty} />
      </View>

      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailHero}>
          <Text style={styles.detailEmoji}>{species.emoji}</Text>
          <Text style={styles.detailName}>{species.name}</Text>
          <Text style={styles.detailScientific}>{species.scientificName}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.description}>{species.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Conseils d'entretien</Text>
          <InfoRow icon="💧" label="Arrosage" text={species.wateringAdvice} />
          <View style={styles.divider} />
          <InfoRow icon="☀️" label="Lumière" text={species.lightAdvice} />
          <View style={styles.divider} />
          <InfoRow icon="💦" label="Humidité" text={species.humidityAdvice} />
          <View style={styles.divider} />
          <InfoRow icon="🌡️" label="Température" text={species.temperatureAdvice} />
          <View style={styles.divider} />
          <InfoRow icon="🌿" label="Engrais" text={species.fertilizingAdvice} />
          <View style={styles.divider} />
          <InfoRow icon="⚠️" label="Problèmes courants" text={species.commonIssues} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Infos</Text>
          <View style={styles.infoChipRow}>
            <View style={styles.infoChip}>
              <Text style={styles.infoChipLabel}>Arrosage</Text>
              <Text style={styles.infoChipValue}>
                tous les {species.defaultWateringFrequencyDays}j
              </Text>
            </View>
            <View style={styles.infoChip}>
              <Text style={styles.infoChipLabel}>Difficulté</Text>
              <Text style={[styles.infoChipValue, { color: difficultyColors[species.difficulty] }]}>
                {species.difficulty}
              </Text>
            </View>
          </View>
          <View style={styles.tagsRow}>
            {species.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function SpeciesScreen() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PlantSpecies | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

  const baseResults = query.length > 0 ? searchSpecies(query) : PLANTS_DATABASE;
  const results = filterDifficulty
    ? baseResults.filter(s => s.difficulty === filterDifficulty)
    : baseResults;

  return (
    <View style={styles.container}>
      <AppHeader
        title="📚 Espèces"
        subtitle={`${PLANTS_DATABASE.length} espèces répertoriées`}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Rechercher une espèce..."
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {[null, 'Facile', 'Moyen', 'Difficile'].map(d => (
          <TouchableOpacity
            key={String(d)}
            style={[
              styles.filterChip,
              filterDifficulty === d && styles.filterChipActive,
              d && { borderColor: difficultyColors[d as string] },
              filterDifficulty === d && d && { backgroundColor: difficultyColors[d as string] },
            ]}
            onPress={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterDifficulty === d && styles.filterChipTextActive,
                d && filterDifficulty !== d && { color: difficultyColors[d as string] },
              ]}
            >
              {d ?? 'Toutes'}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.resultCount}>{results.length}</Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.key}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => setSelected(item)} activeOpacity={0.8}>
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemScientific}>{item.scientificName}</Text>
              <View style={styles.itemMeta}>
                <DifficultyBadge difficulty={item.difficulty} />
                <Text style={styles.itemWatering}>
                  💧 /{item.defaultWateringFrequencyDays}j
                </Text>
                {item.tags.slice(0, 2).map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <SpeciesDetail species={selected} onClose={() => setSelected(null)} />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  searchContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#888' },
  filterChipTextActive: { color: '#fff' },
  resultCount: { marginLeft: 'auto', fontSize: 12, color: '#aaa' },
  item: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  itemEmoji: { fontSize: 36, marginRight: 14, width: 44, textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1a472a' },
  itemScientific: { fontSize: 11, color: '#888', fontStyle: 'italic', marginBottom: 5 },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  itemWatering: { fontSize: 10, color: '#2d6a4f', fontWeight: '600' },
  chevron: { fontSize: 22, color: '#ccc', marginLeft: 8 },
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  tag: { backgroundColor: '#e8f5e9', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 10, color: '#2d6a4f' },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 74 },
  // Detail modal
  detailContainer: { flex: 1, backgroundColor: '#f5f5f0' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2d6a4f',
  },
  closeBtn: { paddingVertical: 4, paddingRight: 8 },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  detailScroll: { flex: 1 },
  detailHero: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#2d6a4f',
  },
  detailEmoji: { fontSize: 72, marginBottom: 8 },
  detailName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  detailScientific: { fontSize: 14, color: '#a8d5ba', fontStyle: 'italic' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d6a4f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  infoIcon: { fontSize: 20, marginRight: 10, width: 28, textAlign: 'center' },
  infoLabel: { fontSize: 12, fontWeight: '700', color: '#2d6a4f', marginBottom: 2 },
  infoText: { fontSize: 13, color: '#555', lineHeight: 19 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 2 },
  infoChipRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoChip: {
    flex: 1,
    backgroundColor: '#f5f5f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoChipLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  infoChipValue: { fontSize: 16, fontWeight: '700', color: '#1a472a' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
