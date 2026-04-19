import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '@/lib/apiProvider';

export default function CharacterScenariosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const characterId = Array.isArray(id) ? id[0] : id;
  const api = useApi();
  const router = useRouter();

  const character = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => api.getCharacter(characterId!),
    enabled: !!characterId,
  });
  const scenarios = useQuery({
    queryKey: ['scenarios', 'by-character', characterId],
    queryFn: () => api.listScenariosForCharacter(characterId!),
    enabled: !!characterId,
  });

  if (character.isLoading || scenarios.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ 戻る</Text>
        </Pressable>
        <Text style={styles.title}>{character.data?.name ?? ''}の物語</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={scenarios.data ?? []}
        keyExtractor={(s) => s.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const locked = item.locked;
          const completed = item.completed;
          return locked ? (
            <View style={[styles.card, styles.cardLocked]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, styles.cardTitleLocked]}>??????</Text>
                <View style={[styles.pill, styles.pillLocked]}>
                  <Text style={styles.pillLockedText}>LOCK</Text>
                </View>
              </View>
              <Text style={styles.lockHint}>好感度 {item.unlockAffinity} で解放</Text>
            </View>
          ) : (
            <Link href={{ pathname: '/scenarios/[slug]', params: { slug: item.slug } }} asChild>
              <Pressable style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {completed && (
                    <View style={[styles.pill, styles.pillDone]}>
                      <Text style={styles.pillDoneText}>既読</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSyn}>{item.synopsis || '物語を読む'}</Text>
              </Pressable>
            </Link>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>シナリオがまだありません</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbf7f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8d8de',
  },
  back: { color: '#e66084' },
  title: { fontSize: 18, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0dae2',
  },
  cardLocked: { backgroundColor: '#f0e6ea', borderColor: '#e8d8de' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardTitleLocked: { color: '#999' },
  cardSyn: { color: '#555', fontSize: 13, lineHeight: 18 },
  lockHint: { color: '#999', fontSize: 13 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillDone: { backgroundColor: '#fff0f4' },
  pillDoneText: { color: '#e66084', fontSize: 11, fontWeight: '700' },
  pillLocked: { backgroundColor: '#d8c9cf' },
  pillLockedText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#888', marginTop: 48 },
});
