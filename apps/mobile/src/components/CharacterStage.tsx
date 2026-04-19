import { useEffect, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

export type StageMood = 'happy' | 'neutral' | 'sad' | 'surprised';

type Props = {
  avatarUrl: string;
  mood?: StageMood;
  thinking?: boolean;
  affinity?: number;
  size?: number;
};

const MOOD_LABEL: Record<StageMood, string> = {
  happy: '...',
  neutral: '..',
  sad: '…',
  surprised: '!',
};

const MOOD_HALO: Record<StageMood, string> = {
  happy: 'rgba(255, 184, 210, 0.9)',
  neutral: 'rgba(255, 255, 255, 0.7)',
  sad: 'rgba(180, 200, 230, 0.85)',
  surprised: 'rgba(255, 230, 160, 0.9)',
};

export function moodFromDelta(delta: number | null): StageMood {
  if (delta === null) return 'neutral';
  if (delta >= 4) return 'surprised';
  if (delta >= 1) return 'happy';
  if (delta <= -2) return 'sad';
  return 'neutral';
}

export function CharacterStage({
  avatarUrl,
  mood = 'neutral',
  thinking = false,
  affinity = 0,
  size = 200,
}: Props) {
  const breath = useSharedValue(0);
  const reaction = useSharedValue(1);
  const haloOpacity = useSharedValue(0.5);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400 }),
        withTiming(0, { duration: 2400 }),
      ),
      -1,
      false,
    );
  }, [breath]);

  useEffect(() => {
    reaction.value = withSequence(
      withSpring(1.08, { damping: 6, stiffness: 140 }),
      withSpring(1, { damping: 8, stiffness: 120 }),
    );
  }, [mood, reaction]);

  useEffect(() => {
    if (thinking) {
      haloOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 }),
        ),
        -1,
        true,
      );
    } else {
      haloOpacity.value = withDelay(
        200,
        withTiming(mood === 'neutral' ? 0.5 : 0.85, { duration: 400 }),
      );
    }
  }, [thinking, mood, haloOpacity]);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -breath.value * 4 },
      { scale: 1 + breath.value * 0.02 },
      { scale: reaction.value },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: 1 + breath.value * 0.03 }],
  }));

  const inner = useMemo(
    () => (
      <>
        <Animated.View
          style={[
            styles.halo,
            { backgroundColor: MOOD_HALO[mood], width: size * 1.12, height: size * 1.12 },
            haloStyle,
          ]}
        />
        <Animated.View style={avatarStyle}>
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          />
        </Animated.View>
      </>
    ),
    [avatarUrl, mood, size, avatarStyle, haloStyle],
  );

  return (
    <View style={[styles.stage, { width: size * 1.3, height: size * 1.3 }]}>
      {inner}
      <View style={styles.badgeRow}>
        <View style={styles.moodBadge}>
          <Text style={styles.moodText}>{MOOD_LABEL[mood]}</Text>
        </View>
        <View style={styles.affinityBadge}>
          <Text style={styles.affinityText}>♡ {affinity}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    borderRadius: 999,
  },
  avatar: {
    backgroundColor: '#eee',
    borderWidth: 3,
    borderColor: '#fff',
  },
  badgeRow: {
    position: 'absolute',
    bottom: 4,
    right: 0,
    flexDirection: 'row',
    gap: 6,
  },
  moodBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 28,
    alignItems: 'center',
  },
  moodText: { color: '#e66084', fontWeight: '700', fontSize: 12 },
  affinityBadge: {
    backgroundColor: '#e66084',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
  },
  affinityText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
