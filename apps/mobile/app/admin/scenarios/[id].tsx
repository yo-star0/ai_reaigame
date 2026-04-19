import type { Scene, SceneKind, ScenarioDetail } from '@ai-reaigame/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '@/lib/apiProvider';

const SCENE_KINDS: SceneKind[] = ['text', 'choice', 'end'];

export default function AdminEditScenarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scenarioId = Array.isArray(id) ? id[0] : id;
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'scenario', scenarioId],
    queryFn: () => api.adminGetScenario(scenarioId!),
    enabled: !!scenarioId,
  });

  const [form, setForm] = useState<ScenarioDetail | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form) throw new Error('No form');
      return api.adminUpdateScenario(scenarioId!, {
        slug: form.slug,
        characterId: form.characterId,
        title: form.title,
        synopsis: form.synopsis,
        unlockAffinity: form.unlockAffinity,
        order: form.order,
        published: form.published,
        scenes: form.scenes.map((s, idx) => ({
          ...s,
          order: idx,
          choices: s.choices.map((c, ci) => ({ ...c, order: ci })),
        })),
      });
    },
    onSuccess: (res) => {
      setForm(res);
      queryClient.invalidateQueries({ queryKey: ['admin', 'scenarios'] });
      setToast('保存しました');
      setTimeout(() => setToast(null), 1500);
    },
    onError: (e) => {
      setToast(`保存失敗: ${(e as Error).message}`);
      setTimeout(() => setToast(null), 3000);
    },
  });

  if (isLoading || !form) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const updateScene = (idx: number, patch: Partial<Scene>) => {
    setForm({
      ...form,
      scenes: form.scenes.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    });
  };
  const moveScene = (idx: number, delta: number) => {
    const next = [...form.scenes];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setForm({ ...form, scenes: next });
  };
  const removeScene = (idx: number) => {
    setForm({ ...form, scenes: form.scenes.filter((_, i) => i !== idx) });
  };
  const addScene = () => {
    setForm({
      ...form,
      scenes: [
        ...form.scenes,
        {
          key: `scene-${form.scenes.length + 1}`,
          kind: 'text',
          body: '',
          nextKey: null,
          order: form.scenes.length,
          choices: [],
        },
      ],
    });
  };

  const updateChoice = (sceneIdx: number, choiceIdx: number, patch: Partial<Scene['choices'][number]>) => {
    setForm({
      ...form,
      scenes: form.scenes.map((s, i) =>
        i !== sceneIdx
          ? s
          : { ...s, choices: s.choices.map((c, ci) => (ci === choiceIdx ? { ...c, ...patch } : c)) },
      ),
    });
  };
  const addChoice = (sceneIdx: number) => {
    setForm({
      ...form,
      scenes: form.scenes.map((s, i) =>
        i !== sceneIdx
          ? s
          : {
              ...s,
              choices: [
                ...s.choices,
                { label: '新しい選択肢', affinityDelta: 0, nextKey: '', order: s.choices.length },
              ],
            },
      ),
    });
  };
  const removeChoice = (sceneIdx: number, choiceIdx: number) => {
    setForm({
      ...form,
      scenes: form.scenes.map((s, i) =>
        i !== sceneIdx ? s : { ...s, choices: s.choices.filter((_, ci) => ci !== choiceIdx) },
      ),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/admin')} hitSlop={8}>
          <Text style={styles.back}>‹ 一覧</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{form.title}</Text>
        <Pressable
          style={[styles.saveBtn, saveMutation.isPending && { opacity: 0.5 }]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>保存</Text>}
        </Pressable>
      </View>
      {toast && <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>}

      <ScrollView contentContainerStyle={styles.body}>
        <Section title="メタ情報">
          <Field label="slug">
            <TextInput
              style={styles.input}
              value={form.slug}
              onChangeText={(slug) => setForm({ ...form, slug })}
              autoCapitalize="none"
            />
          </Field>
          <Field label="タイトル">
            <TextInput style={styles.input} value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
          </Field>
          <Field label="あらすじ">
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.synopsis}
              onChangeText={(synopsis) => setForm({ ...form, synopsis })}
              multiline
            />
          </Field>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="解放好感度">
                <TextInput
                  style={styles.input}
                  value={String(form.unlockAffinity)}
                  onChangeText={(v) => setForm({ ...form, unlockAffinity: Number(v) || 0 })}
                  keyboardType="number-pad"
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="表示順">
                <TextInput
                  style={styles.input}
                  value={String(form.order)}
                  onChangeText={(v) => setForm({ ...form, order: Number(v) || 0 })}
                  keyboardType="number-pad"
                />
              </Field>
            </View>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.label}>公開する</Text>
            <Switch value={form.published} onValueChange={(published) => setForm({ ...form, published })} />
          </View>
        </Section>

        <Section title={`シーン（${form.scenes.length}）`}>
          {form.scenes.map((scene, idx) => (
            <View key={idx} style={styles.sceneCard}>
              <View style={styles.sceneHeader}>
                <Text style={styles.sceneIdx}>{idx + 1}.</Text>
                <TextInput
                  style={[styles.input, styles.sceneKey]}
                  value={scene.key}
                  onChangeText={(key) => updateScene(idx, { key })}
                  placeholder="key"
                  autoCapitalize="none"
                />
                <View style={styles.kindRow}>
                  {SCENE_KINDS.map((k) => (
                    <Pressable
                      key={k}
                      style={[styles.kindBtn, scene.kind === k && styles.kindBtnActive]}
                      onPress={() => updateScene(idx, { kind: k })}
                    >
                      <Text style={[styles.kindText, scene.kind === k && styles.kindTextActive]}>{k}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <TextInput
                style={[styles.input, styles.textarea]}
                value={scene.body}
                onChangeText={(body) => updateScene(idx, { body })}
                placeholder="地の文 / セリフ / 質問"
                multiline
              />

              {scene.kind === 'text' && (
                <Field label="次のシーンのkey">
                  <TextInput
                    style={styles.input}
                    value={scene.nextKey ?? ''}
                    onChangeText={(nextKey) => updateScene(idx, { nextKey: nextKey || null })}
                    placeholder="ask"
                    autoCapitalize="none"
                  />
                </Field>
              )}

              {scene.kind === 'choice' && (
                <View>
                  <Text style={[styles.label, { marginTop: 8 }]}>選択肢</Text>
                  {scene.choices.map((choice, ci) => (
                    <View key={ci} style={styles.choiceRow}>
                      <TextInput
                        style={[styles.input, { flex: 2 }]}
                        value={choice.label}
                        onChangeText={(label) => updateChoice(idx, ci, { label })}
                        placeholder="選択肢"
                      />
                      <TextInput
                        style={[styles.input, { width: 60 }]}
                        value={String(choice.affinityDelta)}
                        onChangeText={(v) => updateChoice(idx, ci, { affinityDelta: Number(v) || 0 })}
                        keyboardType="default"
                        placeholder="±"
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={choice.nextKey}
                        onChangeText={(nextKey) => updateChoice(idx, ci, { nextKey })}
                        placeholder="next key"
                        autoCapitalize="none"
                      />
                      <Pressable style={styles.rmBtn} onPress={() => removeChoice(idx, ci)}>
                        <Text style={styles.rmBtnText}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={styles.addChoice} onPress={() => addChoice(idx)}>
                    <Text style={styles.addChoiceText}>+ 選択肢追加</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.sceneActions}>
                <Pressable style={styles.sceneMoveBtn} onPress={() => moveScene(idx, -1)} disabled={idx === 0}>
                  <Text style={[styles.sceneMoveText, idx === 0 && { opacity: 0.3 }]}>↑</Text>
                </Pressable>
                <Pressable style={styles.sceneMoveBtn} onPress={() => moveScene(idx, 1)} disabled={idx === form.scenes.length - 1}>
                  <Text style={[styles.sceneMoveText, idx === form.scenes.length - 1 && { opacity: 0.3 }]}>↓</Text>
                </Pressable>
                <Pressable style={styles.sceneRemove} onPress={() => removeScene(idx)}>
                  <Text style={styles.sceneRemoveText}>このシーンを削除</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable style={styles.addSceneBtn} onPress={addScene}>
            <Text style={styles.addSceneText}>+ シーン追加</Text>
          </Pressable>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4eff2' },
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
  title: { flex: 1, fontSize: 18, fontWeight: '700' },
  saveBtn: { backgroundColor: '#e66084', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  saveText: { color: '#fff', fontWeight: '700' },
  toast: { position: 'absolute', top: 70, alignSelf: 'center', backgroundColor: 'rgba(42,35,48,0.92)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, zIndex: 10 },
  toastText: { color: '#fff' },
  body: { padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ead4dc' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#e66084', marginBottom: 10 },
  label: { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ead4dc', padding: 10, borderRadius: 8, fontSize: 14 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  sceneCard: { backgroundColor: '#fbf7f8', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f0dae2' },
  sceneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sceneIdx: { fontWeight: '700', color: '#e66084' },
  sceneKey: { flex: 1 },
  kindRow: { flexDirection: 'row', backgroundColor: '#f8eef2', borderRadius: 8, overflow: 'hidden' },
  kindBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  kindBtnActive: { backgroundColor: '#e66084' },
  kindText: { fontSize: 12, color: '#888' },
  kindTextActive: { color: '#fff', fontWeight: '700' },
  choiceRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 },
  rmBtn: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  rmBtnText: { color: '#a55', fontWeight: '700' },
  addChoice: { paddingVertical: 6 },
  addChoiceText: { color: '#e66084', fontWeight: '600' },
  sceneActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  sceneMoveBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f0dae2', borderRadius: 6 },
  sceneMoveText: { color: '#e66084', fontWeight: '700' },
  sceneRemove: { marginLeft: 'auto' },
  sceneRemoveText: { color: '#a55', fontSize: 12 },
  addSceneBtn: { backgroundColor: '#e66084', padding: 12, borderRadius: 10, alignItems: 'center' },
  addSceneText: { color: '#fff', fontWeight: '700' },
});
