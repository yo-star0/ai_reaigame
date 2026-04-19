import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function AdminNewScenarioScreen() {
  const api = useApi();
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [characterId, setCharacterId] = useState('hana');
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [unlockAffinity, setUnlockAffinity] = useState('0');
  const [order, setOrder] = useState('0');
  const [published, setPublished] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      api.adminCreateScenario({
        slug,
        characterId,
        title,
        synopsis,
        unlockAffinity: Number(unlockAffinity) || 0,
        order: Number(order) || 0,
        published,
      }),
    onSuccess: (res) => {
      router.replace({ pathname: '/admin/scenarios/[id]', params: { id: res.id } });
    },
    onError: (e) => {
      if (typeof window !== 'undefined' && window.alert) window.alert((e as Error).message);
      else Alert.alert('エラー', (e as Error).message);
    },
  });

  const canSubmit = slug.trim() && title.trim() && characterId.trim();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ 戻る</Text>
        </Pressable>
        <Text style={styles.title}>新しいシナリオ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Field label="slug（英数字ハイフン、URLになる）">
          <TextInput
            style={styles.input}
            value={slug}
            onChangeText={(t) => setSlug(t.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="hana-new-story"
            autoCapitalize="none"
          />
        </Field>
        <Field label="キャラクターID">
          <TextInput style={styles.input} value={characterId} onChangeText={setCharacterId} autoCapitalize="none" />
        </Field>
        <Field label="タイトル">
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        </Field>
        <Field label="あらすじ">
          <TextInput style={[styles.input, styles.textarea]} value={synopsis} onChangeText={setSynopsis} multiline />
        </Field>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="解放好感度">
              <TextInput style={styles.input} value={unlockAffinity} onChangeText={setUnlockAffinity} keyboardType="number-pad" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="表示順">
              <TextInput style={styles.input} value={order} onChangeText={setOrder} keyboardType="number-pad" />
            </Field>
          </View>
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>公開する</Text>
          <Switch value={published} onValueChange={setPublished} />
        </View>

        <Pressable
          style={[styles.submit, (!canSubmit || mutation.isPending) && { opacity: 0.4 }]}
          onPress={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>作成してシーン編集へ</Text>
          )}
        </Pressable>
        <Text style={styles.hint}>作成後、編集画面でシーンや選択肢を追加できます。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4eff2' },
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
  body: { padding: 16 },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ead4dc',
    padding: 10,
    borderRadius: 8,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  submit: {
    backgroundColor: '#e66084',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitText: { color: '#fff', fontWeight: '700' },
  hint: { color: '#888', fontSize: 12, marginTop: 10, textAlign: 'center' },
});
