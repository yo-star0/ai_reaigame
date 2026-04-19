import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '@/lib/apiProvider';

export default function AdminListScreen() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'scenarios'],
    queryFn: () => api.adminListScenarios(),
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteScenario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'scenarios'] }),
  });

  const confirmDelete = (id: string, title: string) => {
    const ok =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(`「${title}」を削除します。よろしいですか？`)
        : true;
    if (!ok) return;
    setBusyId(id);
    deleteMutation.mutate(id, { onSettled: () => setBusyId(null) });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#a00' }}>{(error as Error).message}</Text>
        <Pressable onPress={() => refetch()} style={styles.linkButton}>
          <Text style={styles.linkText}>再試行</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/')} hitSlop={8}>
          <Text style={styles.back}>‹ 戻る</Text>
        </Pressable>
        <Text style={styles.title}>シナリオ管理</Text>
        <Link href="/admin/scenarios/new" asChild>
          <Pressable style={styles.newBtn}>
            <Text style={styles.newBtnText}>+ 新規作成</Text>
          </Pressable>
        </Link>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={data ?? []}
        keyExtractor={(s) => s.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTitleWrap}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.published ? (
                  <View style={[styles.pill, styles.pillOn]}>
                    <Text style={styles.pillOnText}>公開中</Text>
                  </View>
                ) : (
                  <View style={[styles.pill, styles.pillOff]}>
                    <Text style={styles.pillOffText}>非公開</Text>
                  </View>
                )}
              </View>
              <Text style={styles.rowMeta}>
                {item.slug} ・ キャラ {item.characterId} ・ 解放好感度 {item.unlockAffinity}
              </Text>
              <Text style={styles.rowSynopsis} numberOfLines={2}>
                {item.synopsis || '（概要未記入）'}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <Link
                href={{ pathname: '/admin/scenarios/[id]', params: { id: item.id } }}
                asChild
              >
                <Pressable style={styles.editBtn}>
                  <Text style={styles.editBtnText}>編集</Text>
                </Pressable>
              </Link>
              <Pressable
                style={[styles.delBtn, busyId === item.id && { opacity: 0.5 }]}
                onPress={() => confirmDelete(item.id, item.title)}
                disabled={busyId === item.id}
              >
                <Text style={styles.delBtnText}>削除</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>シナリオがありません</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4eff2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8d8de',
  },
  back: { color: '#e66084', marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  newBtn: { backgroundColor: '#e66084', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  newBtnText: { color: '#fff', fontWeight: '700' },
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ead4dc',
  },
  rowTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  pillOn: { backgroundColor: '#d7f0de' },
  pillOnText: { color: '#2a8a4e', fontSize: 11, fontWeight: '700' },
  pillOff: { backgroundColor: '#eee' },
  pillOffText: { color: '#666', fontSize: 11, fontWeight: '700' },
  rowMeta: { color: '#888', fontSize: 12, marginBottom: 4 },
  rowSynopsis: { color: '#555', fontSize: 13 },
  rowActions: { justifyContent: 'space-between' },
  editBtn: { backgroundColor: '#e66084', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 4 },
  editBtnText: { color: '#fff', fontWeight: '600' },
  delBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e8d8de' },
  delBtnText: { color: '#a55', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 48 },
  linkButton: { marginTop: 12, padding: 8 },
  linkText: { color: '#e66084' },
});
