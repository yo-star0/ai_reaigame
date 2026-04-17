import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { mode, signIn, signUp, signInDev } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [devUid, setDevUid] = useState('demo-user');
  const [busy, setBusy] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const onFirebase = async () => {
    setBusy(true);
    try {
      if (isSignUp) await signUp(email, password);
      else await signIn(email, password);
      router.replace('/characters');
    } catch (e) {
      Alert.alert('認証エラー', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDev = async () => {
    if (!devUid.trim()) return;
    setBusy(true);
    try {
      await signInDev(devUid.trim());
      router.replace('/characters');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>ai_reaigame</Text>
        <Text style={styles.subtitle}>
          {mode === 'firebase' ? 'Firebaseログイン' : 'DEVバイパスモード'}
        </Text>

        {mode === 'firebase' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable style={styles.primary} onPress={onFirebase} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{isSignUp ? 'サインアップ' : 'ログイン'}</Text>}
            </Pressable>
            <Pressable onPress={() => setIsSignUp((v) => !v)}>
              <Text style={styles.link}>{isSignUp ? 'ログインに切替' : 'サインアップに切替'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.hint}>
              Firebase未設定。開発用UIDで擬似ログインします。
            </Text>
            <TextInput
              style={styles.input}
              placeholder="dev uid"
              autoCapitalize="none"
              value={devUid}
              onChangeText={setDevUid}
            />
            <Pressable style={styles.primary} onPress={onDev} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>DEVログイン</Text>}
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  body: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginTop: 4, marginBottom: 24 },
  hint: { fontSize: 12, color: '#888', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  primary: {
    backgroundColor: '#e66084',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryText: { color: '#fff', fontWeight: '600' },
  link: { color: '#e66084', textAlign: 'center', marginTop: 16 },
});
