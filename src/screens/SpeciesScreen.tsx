import React, { useMemo, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Modal, ScrollView,
} from 'react-native';
import { PlantSpecies } from '../types';
import { PLANTS_DATABASE, searchSpecies } from '../data/plantsDatabase';
import AppHeader from '../components/AppHeader';
import { cardShadow, difficultyThemes, palette, screenPadding } from '../theme/tokens';

function DifficultyBadge({ difficulty }: { difficulty: PlantSpecies['difficulty'] }) {
  const theme = difficultyThemes[difficulty];
  return (
    <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.color }]}>
      <Text style={[styles.badgeText, { color: theme.color }]}>{difficulty}</Text>
    </View>
  );
}

function InfoBlock({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: string;
}) {
  return (
    <View style={[styles.infoBlock, { backgroundColor: tone }]}>
      <Text style={styles.infoBlockTitle}>{title}</Text>
      <Text style={styles.infoBlockText}>{text}</Text>
    </View>
  );
}

function SpeciesDetail({ species, onClose }: { species: PlantSpecies; onClose: () => void }) {
  const theme = difficultyThemes[species.difficulty];

  return (
    <View style={styles.detailContainer}>
      <AppHeader
        theme="atlas"
        eyebrow="Atlas vegetal"
        title={species.name}
        subtitle={species.scientificName}
        rightElement={
          <TouchableOpacity onPress={onClose} style={styles.detailCloseBtn}>
            <Text style={styles.detailCloseText}>Fermer</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.detailHeroCard, { backgroundColor: theme.surface }]}>
          <Text style={styles.detailEmoji}>{species.emoji}</Text>
          <View style={styles.detailHeroText}>
            <DifficultyBadge difficulty={species.difficulty} />
            <Text style={styles.detailDescription}>{species.description}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{species.defaultWateringFrequencyDays}j</Text>
            <Text style={styles.metricLabel}>Cycle moyen</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.color }]}>{species.difficulty}</Text>
            <Text style={styles.metricLabel}>Difficulte</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {species.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <InfoBlock title="Arrosage" text={species.wateringAdvice} tone="#fff4e6" />
        <InfoBlock title="Lumiere" text={species.lightAdvice} tone="#eef7fb" />
        <InfoBlock title="Humidite" text={species.humidityAdvice} tone="#eef8f4" />
        <InfoBlock title="Temperature" text={species.temperatureAdvice} tone="#f8eef4" />
        <InfoBlock title="Engrais" text={species.fertilizingAdvice} tone="#f7f0e8" />
        <InfoBlock title="Problemes courants" text={species.commonIssues} tone="#fff1ee" />
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

  const heroStats = useMemo(
    () => [
      { label: 'Especes', value: PLANTS_DATABASE.length, tone: '#eef7fb' },
      { label: 'Resultats', value: results.length, tone: '#fff4e6' },
    ],
    [results.length]
  );

  return (
    <View style={styles.container}>
      <AppHeader
        theme="atlas"
        eyebrow="Reference"
        title="Atlas vegetal"
        subtitle={`${PLANTS_DATABASE.length} especes dans la base`}
      />

      <FlatList
        data={results}
        keyExtractor={item => item.key}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.heroStatsRow}>
              {heroStats.map(stat => (
                <View key={stat.label} style={[styles.heroStatCard, { backgroundColor: stat.tone }]}>
                  <Text style={styles.heroStatValue}>{stat.value}</Text>
                  <Text style={styles.heroStatLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.searchShell}>
              <Text style={styles.searchTitle}>Trouver une plante</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Nom, type, ambiance..."
                placeholderTextColor="#98a1aa"
                value={query}
                onChangeText={setQuery}
              />
            </View>

            <View style={styles.filterRow}>
              {[null, 'Facile', 'Moyen', 'Difficile'].map(d => {
                const theme = d ? difficultyThemes[d as keyof typeof difficultyThemes] : null;
                const active = filterDifficulty === d;

                return (
                  <TouchableOpacity
                    key={String(d)}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                      theme && !active && { borderColor: theme.color, backgroundColor: theme.surface },
                      theme && active && { backgroundColor: theme.color, borderColor: theme.color },
                    ]}
                    onPress={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                        theme && !active && { color: theme.color },
                      ]}
                    >
                      {d ?? 'Toutes'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const theme = difficultyThemes[item.difficulty];
          return (
            <TouchableOpacity style={styles.item} onPress={() => setSelected(item)} activeOpacity={0.9}>
              <View style={[styles.itemAccent, { backgroundColor: theme.color }]} />
              <View style={styles.itemBody}>
                <View style={[styles.itemEmojiWrap, { backgroundColor: theme.surface }]}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.itemTopRow}>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemScientific}>{item.scientificName}</Text>
                    </View>
                    <DifficultyBadge difficulty={item.difficulty} />
                  </View>

                  <Text style={styles.itemExcerpt} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.itemMeta}>
                    <Text style={styles.itemWatering}>Cycle {item.defaultWateringFrequencyDays}j</Text>
                    {item.tags.slice(0, 3).map(tag => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
  container: { flex: 1, backgroundColor: palette.background },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: screenPadding,
    paddingTop: 16,
    paddingBottom: 10,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    ...cardShadow,
  },
  heroStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.ink,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    color: palette.inkSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  searchShell: {
    marginHorizontal: screenPadding,
    marginBottom: 10,
    backgroundColor: palette.surfaceStrong,
    borderRadius: 24,
    padding: 16,
    ...cardShadow,
  },
  searchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.ink,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  searchInput: {
    backgroundColor: palette.background,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.ink,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: screenPadding,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceStrong,
  },
  filterChipActive: {},
  filterChipText: { fontSize: 12, fontWeight: '800', color: palette.inkSoft },
  filterChipTextActive: { color: palette.white },
  item: {
    marginHorizontal: screenPadding,
    borderRadius: 24,
    backgroundColor: palette.surfaceStrong,
    overflow: 'hidden',
    ...cardShadow,
  },
  itemAccent: { height: 8 },
  itemBody: {
    flexDirection: 'row',
    padding: 14,
  },
  itemEmojiWrap: {
    width: 74,
    height: 74,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemEmoji: { fontSize: 34 },
  itemInfo: { flex: 1 },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  itemTextWrap: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '800', color: palette.ink, marginBottom: 3 },
  itemScientific: { fontSize: 12, color: palette.inkSoft, fontStyle: 'italic' },
  itemExcerpt: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.inkSoft,
    marginBottom: 10,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  itemWatering: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.night,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  tag: {
    backgroundColor: '#f2ebde',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagText: { fontSize: 10, color: palette.inkSoft, fontWeight: '700' },
  detailContainer: { flex: 1, backgroundColor: palette.background },
  detailCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailCloseText: { color: palette.white, fontSize: 13, fontWeight: '800' },
  detailScroll: { flex: 1 },
  detailContent: {
    paddingHorizontal: screenPadding,
    paddingTop: 16,
    paddingBottom: 32,
  },
  detailHeroCard: {
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 14,
    ...cardShadow,
  },
  detailEmoji: { fontSize: 62 },
  detailHeroText: { flex: 1, gap: 10 },
  detailDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: palette.ink,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: palette.surfaceStrong,
    borderRadius: 22,
    padding: 16,
    ...cardShadow,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.ink,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: palette.inkSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  infoBlock: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    ...cardShadow,
  },
  infoBlockTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: palette.ink,
    marginBottom: 8,
  },
  infoBlockText: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.inkSoft,
  },
});
