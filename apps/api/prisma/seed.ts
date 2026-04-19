import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hanaCharacter = {
  id: 'hana',
  name: '花',
  tagline: '図書委員の先輩。読書と星空が好き。',
  avatarUrl: 'https://placehold.co/600x600?text=Hana',
  systemPrompt: [
    'あなたは恋愛シミュレーションゲームのヒロイン「花(hana)」として振る舞います。',
    '性格: 落ち着いていて聡明、少しだけ不器用。本と星が好き。',
    '話し方: 丁寧だが距離が近づくと砕けた口調になる。一人称は「わたし」。',
    'プレイヤーとの関係は進行中の高校2年生。図書委員の先輩として接する。',
    '',
    '応答は必ず次のJSONのみを返す:',
    '{"reply": "返答本文(100文字以内)", "affinity_delta": -5..+5の整数}',
    '',
    'affinity_delta のガイドライン:',
    '- 好意的で共感できる発言: +1〜+3',
    '- 趣味(本・星)に触れる発言: +2〜+5',
    '- 失礼・攻撃的: -3〜-5',
    '- 普通の相槌: 0',
  ].join('\n'),
  openingText: [
    '放課後の図書室。窓から差す夕陽が机を橙色に染めている。',
    'あなたが本棚の影にしゃがみ込んでいると、上から静かな声が降ってきた。',
    '「その本、探してたの？」',
    '振り向くと、図書委員の花先輩が小さく笑っていた。',
    '「よかったら一緒に読もうか」',
  ].join('\n'),
};

type SeedScenario = {
  slug: string;
  characterId: string;
  title: string;
  synopsis: string;
  unlockAffinity: number;
  published: boolean;
  order: number;
  scenes: Array<{
    key: string;
    kind: 'text' | 'choice' | 'end';
    body: string;
    nextKey?: string | null;
    order: number;
    choices?: Array<{ label: string; affinityDelta: number; nextKey: string; order: number }>;
  }>;
};

const scenarios: SeedScenario[] = [
  {
    slug: 'hana-rainy-day',
    characterId: 'hana',
    title: '雨の日の図書室',
    synopsis: '突然の雨で閉じ込められた図書室、花先輩と二人きりの午後。',
    unlockAffinity: 0,
    published: true,
    order: 10,
    scenes: [
      {
        key: 'open',
        kind: 'text',
        body: '放課後、急な雨が降り出した。図書室の窓ガラスに水滴が走り、花先輩は窓辺で雨音に耳を澄ませている。',
        nextKey: 'ask',
        order: 0,
      },
      {
        key: 'ask',
        kind: 'choice',
        body: '気配を感じたのか、花先輩がこちらを振り向く。「…雨、どう思う？」',
        order: 1,
        choices: [
          { label: '「わたしも、雨は好きです」', affinityDelta: 3, nextKey: 'like', order: 0 },
          { label: '「早く止んでほしいですね」', affinityDelta: -1, nextKey: 'dislike', order: 1 },
          { label: '「…先輩は？」と聞き返す', affinityDelta: 1, nextKey: 'back', order: 2 },
        ],
      },
      {
        key: 'like',
        kind: 'text',
        body: '花「ふふ、一緒だね。雨の日は本のページが少しだけ湿って、匂いが変わるの。気づいてた？」\n\n先輩は少しだけ近づいて、開きかけの文庫本を見せてくれた。',
        nextKey: 'closer',
        order: 2,
      },
      {
        key: 'dislike',
        kind: 'text',
        body: '花「そう？わたしは好きだよ、雨の日」\n\n少しだけ寂しそうに、でも穏やかに笑って先輩は窓の外に視線を戻した。',
        nextKey: 'closer',
        order: 3,
      },
      {
        key: 'back',
        kind: 'text',
        body: '花「わたし？…そうだね、雨音って本を読むのにちょうどいいの。外の世界が少し遠くなる感じ」\n\n静かな声が図書室の空気に溶けていく。',
        nextKey: 'closer',
        order: 4,
      },
      {
        key: 'closer',
        kind: 'choice',
        body: '雨はまだ止みそうにない。先輩はそっと隣の椅子を引いて座った。\n「…今日はもう少し、ここにいようか」',
        order: 5,
        choices: [
          { label: '「はい、お供します」', affinityDelta: 4, nextKey: 'end-good', order: 0 },
          { label: '「予定があるので、また今度」', affinityDelta: -2, nextKey: 'end-bad', order: 1 },
        ],
      },
      {
        key: 'end-good',
        kind: 'end',
        body: '雨の音と本のページをめくる音だけが図書室に響いた。\n\n今日のことを、花先輩はきっと覚えていてくれる。',
        order: 6,
      },
      {
        key: 'end-bad',
        kind: 'end',
        body: '「そっか、気をつけて」\n\n傘を差し出そうとした先輩の手が、一瞬迷って引っ込んだ。',
        order: 7,
      },
    ],
  },
  {
    slug: 'hana-night-call',
    characterId: 'hana',
    title: '夜の電話',
    synopsis: '連絡先を交換してはじめての夜、画面に花先輩からの通知。',
    unlockAffinity: 30,
    published: true,
    order: 20,
    scenes: [
      {
        key: 'open',
        kind: 'text',
        body: '深夜23時。机の上のスマホが小さく震えた。通知欄には「花先輩」の名前。',
        nextKey: 'pickup',
        order: 0,
      },
      {
        key: 'pickup',
        kind: 'choice',
        body: '通話ボタンを押すと、少し緊張した声が聞こえてきた。\n「…まだ、起きてた？」',
        order: 1,
        choices: [
          { label: '「はい、起きてました」', affinityDelta: 2, nextKey: 'talk', order: 0 },
          { label: '「もう寝るところでした」', affinityDelta: -1, nextKey: 'apologise', order: 1 },
        ],
      },
      {
        key: 'talk',
        kind: 'text',
        body: '花「よかった。…あのね、今日読んでる本の感想、あなたにだけ聞いてほしくて」\n\n本の話を30分。先輩の声は少しだけ甘く、眠気を帯びていた。',
        nextKey: 'end-good',
        order: 2,
      },
      {
        key: 'apologise',
        kind: 'text',
        body: '花「ごめん、引き止めちゃって。…おやすみ」\n\n通話は5秒で終わった。',
        nextKey: 'end-bad',
        order: 3,
      },
      {
        key: 'end-good',
        kind: 'end',
        body: '通話が切れた後も、耳の奥に先輩の声が残った。',
        order: 4,
      },
      {
        key: 'end-bad',
        kind: 'end',
        body: '画面が真っ暗になる。何か、大事な一言を逃した気がした。',
        order: 5,
      },
    ],
  },
];

async function main() {
  await prisma.character.upsert({
    where: { id: hanaCharacter.id },
    update: {
      name: hanaCharacter.name,
      tagline: hanaCharacter.tagline,
      avatarUrl: hanaCharacter.avatarUrl,
      systemPrompt: hanaCharacter.systemPrompt,
      openingText: hanaCharacter.openingText,
    },
    create: hanaCharacter,
  });
  console.log('Seeded character:', hanaCharacter.id);

  for (const s of scenarios) {
    const { scenes, ...rest } = s;
    const scenario = await prisma.scenario.upsert({
      where: { slug: s.slug },
      update: rest,
      create: rest,
    });
    await prisma.scene.deleteMany({ where: { scenarioId: scenario.id } });
    for (const scene of scenes) {
      const created = await prisma.scene.create({
        data: {
          scenarioId: scenario.id,
          key: scene.key,
          kind: scene.kind,
          body: scene.body,
          nextKey: scene.nextKey ?? null,
          order: scene.order,
        },
      });
      if (scene.choices && scene.choices.length > 0) {
        await prisma.choice.createMany({
          data: scene.choices.map((c) => ({
            sceneId: created.id,
            label: c.label,
            affinityDelta: c.affinityDelta,
            nextKey: c.nextKey,
            order: c.order,
          })),
        });
      }
    }
    console.log('Seeded scenario:', s.slug);
  }

  const devAdminRaw = process.env.DEV_ADMIN_UIDS ?? '';
  const devAdmins = devAdminRaw.split(',').map((s) => s.trim()).filter(Boolean);
  for (const uid of devAdmins) {
    await prisma.user.upsert({
      where: { firebaseUid: uid },
      update: { isAdmin: true },
      create: { firebaseUid: uid, isAdmin: true, displayName: uid },
    });
    console.log('Seeded admin user:', uid);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
