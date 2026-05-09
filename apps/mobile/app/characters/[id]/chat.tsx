import type { Message, SendMessageResponse } from '@ai-reaigame/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
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
import { CharacterStage, moodFromDelta } from '@/components/CharacterStage';
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
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }} 
          style={styles.back} 
          hitSlop={24}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, marginLeft: 4 }}>
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

      {character?.avatarUrl && (
        <View style={styles.stageWrap}>
          <CharacterStage
            avatarUrl={character.avatarUrl}
            mood={moodFromDelta(recentDelta)}
            thinking={sendMutation.isPending}
            affinity={affinity}
            size={140}
          />
        </View>
      )}

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
          ListEmptyComponent={<Text style={styles.empty}>話しかけてみよう（英語で話しかけると喜ぶかも…？）</Text>}
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

let activePlaybackId = 0;
let activeSound: Audio.Sound | null = null;

function MessageBubble({ message, avatarUrl }: { message: Message; avatarUrl?: string }) {
  const isUser = message.role === 'user';
  
  let mainText = message.content;
  let tipText = null;

  if (!isUser && mainText.includes('【ワンポイント】')) {
    const parts = mainText.split('【ワンポイント】');
    mainText = parts[0].trim();
    tipText = parts[1].trim();
  }

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
        <Text style={styles.textAssistant}>{mainText}</Text>
        {tipText && (
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 ワンポイント</Text>
            <Text style={styles.tipText}>{tipText}</Text>
          </View>
        )}
        <Pressable
          onPress={async () => {
            activePlaybackId++;
            const myPlaybackId = activePlaybackId;

            Speech.stop();
            if (activeSound) {
              try { await activeSound.stopAsync(); } catch (e) {}
              try { await activeSound.unloadAsync(); } catch (e) {}
              activeSound = null;
            }

            // 英語と日本語を分割するための正規表現（アルファベットを含むフレーズを抽出）
            const regex = /([a-zA-Z]+(?:[\s.,!?'"’\-]+[a-zA-Z]+)*[\s.,!?'"’\-]*)/g;
            const parts = mainText.split(regex).filter(p => p.trim().length > 0);

            for (const part of parts) {
              if (myPlaybackId !== activePlaybackId) return; // 別の再生が始まったら中止

              const isEnglish = /[a-zA-Z]/.test(part);
              if (isEnglish) {
                // 英語部分：少し高めでネイティブな発音
                await new Promise<void>((resolve) => {
                  Speech.speak(part, { 
                    language: 'en-US', 
                    rate: 0.9, 
                    pitch: 1.3,
                    onDone: () => resolve(),
                    onStopped: () => resolve(),
                    onError: () => resolve(),
                  });
                });
              } else {
                // 日本語部分：無料のVOICEVOX API（四国めたん等の可愛い声）を使用
                try {
                  const res = await fetch(`https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(part)}&speaker=2`);
                  const data = await res.json();
                  if (myPlaybackId !== activePlaybackId) return; // fetch中に別再生が来たら中止
                  
                  if (data.mp3StreamingUrl) {
                    const { sound } = await Audio.Sound.createAsync(
                      { uri: data.mp3StreamingUrl },
                      { shouldPlay: true }
                    );
                    activeSound = sound;
                    
                    await new Promise<void>((resolve) => {
                      sound.setOnPlaybackStatusUpdate((status) => {
                        if (status.isLoaded && status.didJustFinish) {
                          sound.unloadAsync().catch(()=>{});
                          if (activeSound === sound) activeSound = null;
                          resolve();
                        }
                      });
                    });
                  } else {
                    throw new Error("No audio url");
                  }
                } catch (e) {
                  // API失敗時のフォールバック（通常のOS音声）
                  await new Promise<void>((resolve) => {
                    Speech.speak(part, { 
                      language: 'ja-JP', 
                      rate: 1.0, 
                      pitch: 1.5,
                      onDone: () => resolve(),
                      onStopped: () => resolve(),
                      onError: () => resolve(),
                    });
                  });
                }
              }
            }
          }}
          style={styles.speakerBtn}
        >
          <Text style={styles.speakerIcon}>🔊 Listen</Text>
        </Pressable>
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
  stageWrap: { alignItems: 'center', paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0dae2' },
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
  tipBox: { marginTop: 12, backgroundColor: '#fdf8f4', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#f7dfce' },
  tipTitle: { fontSize: 12, fontWeight: '700', color: '#d97f48', marginBottom: 4 },
  tipText: { fontSize: 12, color: '#666', lineHeight: 18 },
  speakerBtn: { alignSelf: 'flex-end', marginTop: 6, backgroundColor: '#f0e0e6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  speakerIcon: { fontSize: 12, color: '#e66084', fontWeight: 'bold' },
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
