import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '@/lib/apiProvider';

export default function OpeningScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const characterId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);

  const { data } = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => api.getCharacter(characterId!),
    enabled: !!characterId,
  });

  const lines = useMemo(() => {
    if (!data?.openingText) return [] as string[];
    return data.openingText.split('\n').filter((l) => l.trim().length > 0);
  }, [data?.openingText]);

  const completeOpening = useMutation({
    mutationFn: () => api.completeOpening(characterId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['character', characterId] });
      router.replace({ pathname: '/characters/[id]/chat', params: { id: characterId! } });
    },
  });

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const isLast = index >= lines.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scene}>
        {lines.slice(0, index + 1).map((line, i) => (
          <Text key={i} style={[styles.line, i === index && styles.lineActive]}>
            {line}
          </Text>
        ))}
      </View>

      <Pressable
        style={styles.next}
        onPress={() => {
          if (isLast) completeOpening.mutate();
          else setIndex((v) => v + 1);
        }}
        disabled={completeOpening.isPending}
      >
        <Text style={styles.nextText}>
          {completeOpening.isPending ? '…' : isLast ? '会話を始める' : '次へ'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1620' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scene: { flex: 1, padding: 24, justifyContent: 'flex-end' },
  line: { color: '#bbb', fontSize: 16, lineHeight: 24, marginBottom: 8 },
  lineActive: { color: '#fff' },
  next: {
    backgroundColor: '#e66084',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontWeight: '700' },
});
