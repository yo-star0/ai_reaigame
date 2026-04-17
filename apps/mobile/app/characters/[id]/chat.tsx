import type { Message, SendMessageResponse } from '@ai-reaigame/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '@/lib/apiProvider';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const characterId = Array.isArray(id) ? id[0] : id;
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
      queryClient.setQueryData(['character', characterId], (old: ReturnType<typeof Object> | undefined) => {
        if (!old || typeof old !== 'object') return old;
        return { ...(old as Record<string, unknown>), affinity: res.affinity };
      });
      setTimeout(() => setRecentDelta(null), 1800);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{characterQuery.data?.name ?? ''}</Text>
        <View style={styles.affinityPill}>
          <Text style={styles.affinityText}>好感度 {characterQuery.data?.affinity ?? 0}</Text>
          {recentDelta !== null && (
            <Text style={[styles.delta, recentDelta < 0 && styles.deltaNeg]}>
              {recentDelta > 0 ? `+${recentDelta}` : recentDelta}
            </Text>
          )}
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
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => <MessageBubble message={item} />}
          ListEmptyComponent={<Text style={styles.empty}>話しかけてみよう</Text>}
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

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={isUser ? styles.textUser : styles.textAssistant}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  affinityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  affinityText: { color: '#e66084', fontWeight: '600' },
  delta: { marginLeft: 6, color: '#2a8a4e', fontWeight: '700' },
  deltaNeg: { color: '#b04040' },
  empty: { textAlign: 'center', color: '#888', marginTop: 48 },
  row: { marginBottom: 8, flexDirection: 'row' },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', padding: 10, borderRadius: 14 },
  bubbleUser: { backgroundColor: '#e66084' },
  bubbleAssistant: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  textUser: { color: '#fff' },
  textAssistant: { color: '#222' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f2f2f2',
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
