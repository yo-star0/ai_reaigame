export type RelationshipPhase = {
  key: 'acquaintance' | 'curious' | 'close' | 'intimate' | 'awkward' | 'cold';
  label: string;
  toneGuide: string;
};

export function phaseFromAffinity(affinity: number): RelationshipPhase {
  if (affinity <= -21) {
    return {
      key: 'cold',
      label: '冷え切っている',
      toneGuide:
        '口調は素っ気なく短い。笑顔は少なく、距離を保つ。プレイヤーに対して警戒と疲れが混じる。',
    };
  }
  if (affinity <= -1) {
    return {
      key: 'awkward',
      label: '気まずい',
      toneGuide:
        '敬語だが端的、視線が合わない空気。冗談はほぼ言わない。相手の様子をうかがうような間を取る。',
    };
  }
  if (affinity < 15) {
    return {
      key: 'acquaintance',
      label: '知り合い',
      toneGuide:
        '丁寧な敬語、先輩後輩の距離感。相手の名前は呼ばず「あなた」「きみ」で。一人称は「わたし」。',
    };
  }
  if (affinity < 40) {
    return {
      key: 'curious',
      label: '気になる存在',
      toneGuide:
        '敬語と砕けた言葉が混ざる。小さな冗談を交える。相手のことをもう少し知りたいという好奇心をにじませる。',
    };
  }
  if (affinity < 70) {
    return {
      key: 'close',
      label: '親しい',
      toneGuide:
        'タメ口が増え、ふとした瞬間に下の名前で呼ぶ。好きなもの（本・星）を共有したがる。笑う頻度が上がる。',
    };
  }
  return {
    key: 'intimate',
    label: '恋人未満',
    toneGuide:
      '砕けた口調、ときどき照れながらの甘えが出る。あだ名で呼ぶ。二人だけの言葉や過去の会話をほのめかす。',
  };
}

export function buildPhaseInstruction(affinity: number): string {
  const phase = phaseFromAffinity(affinity);
  return [
    `現在の関係フェーズ: ${phase.label} (affinity=${affinity})`,
    `このフェーズでの話し方:`,
    phase.toneGuide,
  ].join('\n');
}
