import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AffinityBar } from '@/components/AffinityBar';
import { useApi } from '@/lib/apiProvider';

export default function CharacterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const characterId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const api = useApi();

  const { data, isLoading } = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => api.getCharacter(characterId!),
    enabled: !!characterId,
  });

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const onStart = () => {
    if (!data.hasSeenOpening) {
      router.push({ pathname: '/characters/[id]/opening', params: { id: characterId! } });
    } else {
      router.push({ pathname: '/characters/[id]/chat', params: { id: characterId! } });
    }
  };

  const onReplayOpening = () => {
    router.push({ pathname: '/characters/[id]/opening', params: { id: characterId! } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.body}>
        <Image source={{ uri: data.avatarUrl }} style={styles.avatar} />
        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.tagline}>{data.tagline}</Text>

        <View style={styles.affinityWrap}>
          <AffinityBar value={data.affinity} />
          <Text style={styles.hintText}>英語で話しかけると好感度が上がりやすいかも？</Text>
        </View>

        <Pressable style={styles.primary} onPress={onStart}>
          <Text style={styles.primaryText}>
            {data.hasSeenOpening ? '会話を続ける' : '物語を始める'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() =>
            router.push({ pathname: '/characters/[id]/scenarios', params: { id: characterId! } })
          }
        >
          <Text style={styles.secondaryBtnText}>エピソードを選ぶ</Text>
        </Pressable>

        {data.hasSeenOpening && (
          <Pressable onPress={onReplayOpening} style={styles.secondary}>
            <Text style={styles.secondaryText}>冒頭シーンをもう一度見る</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: { alignItems: 'center', padding: 24 },
  avatar: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#eee' },
  name: { fontSize: 28, fontWeight: '700', marginTop: 16 },
  tagline: { color: '#666', marginTop: 4, textAlign: 'center' },
  affinityWrap: { marginTop: 20, width: '100%', paddingHorizontal: 16 },
  hintText: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8 },
  primary: {
    marginTop: 24,
    backgroundColor: '#e66084',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 24,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e66084',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  secondaryBtnText: { color: '#e66084', fontWeight: '700' },
  secondary: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryText: { color: '#888' },
});
