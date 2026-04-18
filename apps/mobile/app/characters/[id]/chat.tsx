import type { Message, SendMessageResponse } from '@ai-reaigame/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AffinityBar } from '@/components/AffinityBar';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useApi } from '@/lib/apiProvider';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const characterId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();

  const [input, setInput] = useState('');
  const [recentDelta, setRecentDelta] = useState<number | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const characterQuery = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => api.getCharacter(characterId!),
    enabled: !!characterId,
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', characterId],
    queryFn: () => api.listMessages(characterId!),
    enabled: !!characterId,
  });

  const orderedMessages = useMemo<Message[]>(() => {
    const items = messagesQuery.data?.items ?? [];
    return [...items].reverse();
  }, [messagesQuery.data]);

  useEffect(() => {
    if (orderedMessages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [orderedMessages.length]);

  const sendMutation = useMutation<SendMessageResponse, Error, string>({
    mutationFn: (content) => api.sendMessage(characterId!, content),
    onSuccess: (res) => {
      setRecentDelta(res.affinityDelta);
      queryClient.setQueryData<{ items: Message[]; nextCursor: string | null }>(
        ['messages', characterId],
        (old) => {
          const items = old?.items ?? [];
          return { items: [res.assistant, res.user, ...items], nextCursor: old?.nextCursor ?? null };
        },
      );
      queryClient.setQueryData(['character', characterId], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...(old as Record<string, unknown>), affinity: res.affinity };
      });
      setTimeout(() => setRecentDelta(null), 2000);
    },
  });

  const onSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    setInput('');
    sendMutation.mutate(trimmed);
  }, [input, sendMutation]);

  if (characterQuery.isLoading || messagesQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const character = characterQuery.data;
  const affinity = character?.affinity ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        {character?.avatarUrl && (
          <Image source={{ uri: character.avatarUrl }} style={styles.headerAvatar} />
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{character?.name ?? ''}</Text>
            {recentDelta !== null && (
              <Text style={[styles.delta, recentDelta < 0 && styles.deltaNeg]}>
                {recentDelta > 0 ? `+${recentDelta}` : recentDelta}
              </Text>
            )}
          </View>
          <AffinityBar value={affinity} compact />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={orderedMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MessageBubble message={item} avatarUrl={character?.avatarUrl} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>話しかけてみよう</Text>}
          ListFooterComponent={sendMutation.isPending ? <TypingIndicator /> : null}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="メッセージを入力"
            multiline
          />
          <Pressable
            style={[styles.send, (!input.trim() || sendMutation.isPending) && styles.sendDisabled]}
            onPress={onSend}
            disabled={!input.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendText}>送信</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message, avatarUrl }: { message: Message; avatarUrl?: string }) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View style={[styles.bubble, styles.bubbleUser]}>
          <Text style={styles.textUser}>{message.content}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.row, styles.rowAssistant]}>
      {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.bubbleAvatar} /> : <View style={styles.bubbleAvatarFallback} />}
      <View style={[styles.bubble, styles.bubbleAssistant]}>
        <Text style={styles.textAssistant}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbf7f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8d8de',
  },
  back: { paddingHorizontal: 6, paddingVertical: 2 },
  backText: { fontSize: 26, color: '#e66084', lineHeight: 26 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', marginLeft: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', marginRight: 8 },
  delta: { color: '#2a8a4e', fontWeight: '700' },
  deltaNeg: { color: '#b04040' },
  empty: { textAlign: 'center', color: '#888', marginTop: 48 },
  listContent: { padding: 16 },
  row: { marginBottom: 10, flexDirection: 'row', alignItems: 'flex-end' },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  bubbleAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#eee' },
  bubbleAvatarFallback: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#eee' },
  bubble: { maxWidth: '74%', padding: 10, borderRadius: 14 },
  bubbleUser: { backgroundColor: '#e66084' },
  bubbleAssistant: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0e0e6' },
  textUser: { color: '#fff', lineHeight: 20 },
  textAssistant: { color: '#333', lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8d8de',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8eef2',
    borderRadius: 12,
    marginRight: 8,
  },
  send: {
    backgroundColor: '#e66084',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#fff', fontWeight: '700' },
});
