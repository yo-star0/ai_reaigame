import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthContext';
import { useApi } from '@/lib/apiProvider';

export default function CharactersScreen() {
  const api = useApi();
  const router = useRouter();
  const { signOut } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['characters'],
    queryFn: () => api.listCharacters(),
  });

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
        <Text style={styles.errorTitle}>ロード失敗</Text>
        <Text style={styles.errorText}>{(error as Error).message}</Text>
        <Pressable onPress={() => refetch()} style={styles.retry}>
          <Text style={styles.retryText}>再試行</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ヒロイン選択</Text>
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
        >
          <Text style={styles.signOut}>ログアウト</Text>
        </Pressable>
      </View>
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={data ?? []}
        keyExtractor={(c) => c.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/characters/[id]', params: { id: item.id } }} asChild>
            <Pressable style={styles.card}>
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.tagline}>{item.tagline}</Text>
              </View>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={<Text style={styles.empty}>ヒロインが登録されていません</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  signOut: { color: '#666' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eee' },
  name: { fontSize: 18, fontWeight: '600' },
  tagline: { color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', color: '#888', marginTop: 32 },
  errorTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  errorText: { color: '#a00', textAlign: 'center', marginBottom: 12 },
  retry: { backgroundColor: '#e66084', padding: 10, borderRadius: 8 },
  retryText: { color: '#fff' },
});
