import { StyleSheet, Text, View } from 'react-native';

type Props = {
  value: number;
  min?: number;
  max?: number;
  compact?: boolean;
};

export function AffinityBar({ value, min = -100, max = 100, compact = false }: Props) {
  const range = max - min;
  const pct = Math.max(0, Math.min(1, (value - min) / range));
  const label = affinityLabel(value);
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact && (
        <View style={styles.row}>
          <Text style={styles.label}>好感度</Text>
          <Text style={styles.value}>
            {value}{' '}
            <Text style={styles.stage}>{label}</Text>
          </Text>
        </View>
      )}
      <View style={[styles.track, compact && styles.trackCompact]}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
        <View style={[styles.zeroMark, { left: `${((0 - min) / range) * 100}%` }]} />
      </View>
    </View>
  );
}

function affinityLabel(value: number): string {
  if (value >= 70) return '恋人未満';
  if (value >= 40) return '親しい';
  if (value >= 15) return '気になる存在';
  if (value >= 0) return '知り合い';
  if (value >= -20) return '気まずい';
  return '冷え切っている';
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  wrapCompact: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#e66084', fontWeight: '600' },
  value: { color: '#333', fontWeight: '700' },
  stage: { color: '#888', fontWeight: '500', fontSize: 12 },
  track: {
    height: 8,
    backgroundColor: '#f0e0e6',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  trackCompact: { flex: 1, height: 6, borderRadius: 3 },
  fill: {
    height: '100%',
    backgroundColor: '#e66084',
  },
  zeroMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#ccc',
  },
});
