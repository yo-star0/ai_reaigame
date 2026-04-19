import type { Scene } from '@ai-reaigame/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '@/lib/apiProvider';

export default function ScenarioPlayScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scenarioSlug = Array.isArray(slug) ? slug[0] : slug;
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['scenario', scenarioSlug],
    queryFn: () => api.getScenario(scenarioSlug!),
    enabled: !!scenarioSlug,
  });

  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [affinityTotal, setAffinityTotal] = useState(0);
  const [history, setHistory] = useState<Scene[]>([]);
  const [completed, setCompleted] = useState(false);
  const [finishMsg, setFinishMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data && data.scenes.length > 0 && !currentKey) {
      setCurrentKey(data.scenes[0].key);
      setHistory([data.scenes[0]]);
    }
  }, [data, currentKey]);

  const scenesByKey = useMemo(() => {
    const m = new Map<string, Scene>();
    data?.scenes.forEach((s) => m.set(s.key, s));
    return m;
  }, [data]);

  const completeMutation = useMutation({
    mutationFn: (payload: { lastSceneKey: string; totalAffinityDelta: number }) =>
      api.completeScenario(scenarioSlug!, payload),
    onSuccess: (res) => {
      setCompleted(true);
      setFinishMsg(
        res.affinityDelta >= 0
          ? `関係が深まった（好感度 ${res.affinity}、+${res.affinityDelta}）`
          : `少しぎこちない（好感度 ${res.affinity}、${res.affinityDelta}）`,
      );
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
  });

  if (isLoading || !data || !currentKey) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const current = scenesByKey.get(currentKey);
  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#a00' }}>シーン "{currentKey}" が見つかりません</Text>
        <Pressable onPress={() => router.back()} style={styles.primary}>
          <Text style={styles.primaryText}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  const goTo = (nextKey: string, delta = 0) => {
    const next = scenesByKey.get(nextKey);
    if (!next) return;
    setAffinityTotal((v) => v + delta);
    setCurrentKey(nextKey);
    setHistory((h) => [...h, next]);
  };

  const onNext = () => {
    if (current.kind === 'text' && current.nextKey) {
      goTo(current.nextKey, 0);
    } else if (current.kind === 'end' && !completed) {
      completeMutation.mutate({
        lastSceneKey: current.key,
        totalAffinityDelta: affinityTotal,
      });
    } else if (completed) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ 途中で戻る</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {history.length} / {data.scenes.length}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {history.map((scene, idx) => (
          <View
            key={`${scene.key}-${idx}`}
            style={[styles.bubble, idx === history.length - 1 && styles.bubbleActive]}
          >
            <Text style={styles.bubbleText}>{scene.body}</Text>
          </View>
        ))}

        {current.kind === 'choice' && (
          <View style={styles.choiceList}>
            {current.choices.map((c) => (
              <Pressable
                key={c.id ?? c.label}
                style={styles.choiceBtn}
                onPress={() => goTo(c.nextKey, c.affinityDelta)}
              >
                <Text style={styles.choiceText}>{c.label}</Text>
                {c.affinityDelta !== 0 && (
                  <Text style={[styles.choiceDelta, c.affinityDelta < 0 && styles.choiceDeltaNeg]}>
                    {c.affinityDelta > 0 ? `+${c.affinityDelta}` : c.affinityDelta}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {current.kind !== 'choice' && (
        <View style={styles.footer}>
          {completed && finishMsg && <Text style={styles.finish}>{finishMsg}</Text>}
          <Pressable
            style={styles.primary}
            onPress={onNext}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>
                {current.kind === 'end'
                  ? completed
                    ? '戻る'
                    : 'おわり'
                  : '次へ'}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1620' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#1a1620' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: '#241c2a',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3a2d3a',
  },
  back: { color: '#f6a9c4' },
  title: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700' },
  counter: { backgroundColor: '#3a2d3a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  counterText: { color: '#f6a9c4', fontSize: 12, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 24 },
  bubble: { backgroundColor: '#2a2330', borderRadius: 14, padding: 16, marginBottom: 10 },
  bubbleActive: { backgroundColor: '#382a3a', borderLeftWidth: 3, borderLeftColor: '#e66084' },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 24 },
  choiceList: { marginTop: 16, gap: 10 },
  choiceBtn: {
    backgroundColor: '#e66084',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceText: { color: '#fff', fontSize: 15, flex: 1, marginRight: 10 },
  choiceDelta: { color: '#d6ffda', fontWeight: '700', fontSize: 12 },
  choiceDeltaNeg: { color: '#ffd1d1' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#3a2d3a', backgroundColor: '#241c2a' },
  finish: { color: '#f6a9c4', textAlign: 'center', marginBottom: 10 },
  primary: { backgroundColor: '#e66084', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
});
