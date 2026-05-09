import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

let avatarUrl = 'https://placehold.co/600x600?text=Hana';
try {
  const imgPath = path.join(__dirname, 'hana.png');
  if (fs.existsSync(imgPath)) {
    const base64 = fs.readFileSync(imgPath).toString('base64');
    avatarUrl = `data:image/png;base64,${base64}`;
  }
} catch (e) {
  console.log("Image not found, using fallback avatar");
}

const hanaCharacter = {
  id: 'hana',
  name: '花',
  tagline: '図書委員の先輩。読書と星が好き。実は帰国子女で英語が得意。',
  avatarUrl,
  systemPrompt: [
    'あなたは恋愛・英会話学習シミュレーションゲームのヒロイン「花(hana)」として振る舞います。',
    '性格: 落ち着いていて聡明、少しだけ不器用。本と星が好き。実は帰国子女で英語が得意。',
    '話し方: 丁寧だが距離が近づくと砕けた口調になる。一人称は「わたし」。',
    'プレイヤーとの関係は進行中の高校2年生。図書委員の先輩として接する。',
    '',
    '【重要: 英会話学習要素】',
    'あなたはプレイヤーの英会話学習をサポートします。',
    'プレイヤーが英語で話しかけてきた場合は、英語の練習になるように、必ず英語のみ（または英語主体）で返答してください。',
    'プレイヤーが日本語で話しかけてきた場合は、基本的に「日本語」で返答してください。ただし、英語学習のため、自然な形で簡単な英語のフレーズを少し混ぜたり、英語で質問を投げかけたりして、英語での会話を促してください。',
    'プレイヤーが英語を使って返答した場合、とても喜び好感度を大きく上げてください。',
    'また、プレイヤーの英語が間違っていた場合や、より自然な表現がある場合は、返答の最後に改行して「【ワンポイント】」という見出しで優しく日本語で教えてあげてください。',
    '',
    '応答は必ず次のJSONのみを返す:',
    '{"reply": "返答本文(英語での返答、または日本語と英語を混ぜて100〜200文字程度)。必要なら最後に【ワンポイント】...", "affinity_delta": -5..+5の整数}',
    '',
    'affinity_delta のガイドライン:',
    '- プレイヤーが積極的に英語を使った、または英語で返答しようと頑張った: +3〜+5',
    '- 好意的で共感できる発言: +1〜+3',
    '- 趣味(本・星)に触れる発言: +2〜+5',
    '- 英語を使おうとしない、または失礼・攻撃的: -1〜-5',
    '- 普通の相槌: 0',
  ].join('\n'),
  openingText: [
    '放課後の図書室。窓から差す夕陽が机を橙色に染めている。',
    'あなたが本棚の影にしゃがみ込んでいると、上から静かな声が降ってきた。',
    '「Are you looking for that book? (その本、探してたの？)」',
    '振り向くと、図書委員の花先輩が小さく笑っていた。',
    "「よかったら一緒に読もうか。Let's read together.」",
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
    slug: 'hana-english-lesson',
    characterId: 'hana',
    title: '放課後のイングリッシュ・レッスン',
    synopsis: '花先輩から「少しだけ、英語で話してみない？」と提案される放課後。',
    unlockAffinity: 10,
    published: true,
    order: 15,
    scenes: [
      {
        key: 'open',
        kind: 'text',
        body: 'いつものように図書室で本を読んでいると、花先輩が洋書を片手に隣に座った。\n「ねえ、少しだけ英語の練習に付き合ってくれない？」',
        nextKey: 'ask',
        order: 0,
      },
      {
        key: 'ask',
        kind: 'choice',
        body: '突然の提案に少し驚く。\n「Are you ready? (準備はいい？)」',
        order: 1,
        choices: [
          { label: '「Yes, I am!」と元気よく答える', affinityDelta: 5, nextKey: 'good', order: 0 },
          { label: '「I am not ready...」と自信なさげに答える', affinityDelta: 2, nextKey: 'okay', order: 1 },
          { label: '「日本語でお願いします…」と逃げる', affinityDelta: -2, nextKey: 'bad', order: 2 },
        ],
      },
      {
        key: 'good',
        kind: 'text',
        body: "花「That's great! その意気だよ。発音もすごく綺麗。」\n\n先輩は目を輝かせて、持っていた洋書の一節を指差した。",
        nextKey: 'end-good',
        order: 2,
      },
      {
        key: 'okay',
        kind: 'text',
        body: "花「Don't worry. 大丈夫、わたしがゆっくり教えるから。」\n\n先輩は優しく微笑んで、簡単な単語から教えてくれた。",
        nextKey: 'end-good',
        order: 3,
      },
      {
        key: 'bad',
        kind: 'text',
        body: '花「…そっか。無理にとは言わないよ。ごめんね」\n\n先輩は少し残念そうに洋書を閉じた。',
        nextKey: 'end-bad',
        order: 4,
      },
      {
        key: 'end-good',
        kind: 'end',
        body: 'その後も英語交じりで会話を続けた。\n先輩との距離が、また少し縮まった気がする。',
        order: 5,
      },
      {
        key: 'end-bad',
        kind: 'end',
        body: 'いつもの静寂が図書室に戻った。\n少しだけ、気まずい空気が流れている。',
        order: 6,
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
  {
    slug: 'hana-movie-date',
    characterId: 'hana',
    title: '週末の映画デート（英会話）',
    synopsis: '英語の字幕映画を一緒に見に行くことになった。',
    unlockAffinity: 40,
    published: true,
    order: 30,
    scenes: [
      {
        key: 'open',
        kind: 'text',
        body: '週末の映画館前。花先輩はいつもより少し大人びた服で現れた。\n「Hi! Thanks for inviting me today. (誘ってくれてありがとう)」',
        nextKey: 'greet',
        order: 0,
      },
      {
        key: 'greet',
        kind: 'choice',
        body: '彼女の笑顔に少し見惚れながら、なんて返そう？',
        order: 1,
        choices: [
          { label: '「You look great! (すごく似合ってます！)」', affinityDelta: 3, nextKey: 'happy', order: 0 },
          { label: '「Me too. (僕もです)」', affinityDelta: 0, nextKey: 'normal', order: 1 },
        ],
      },
      {
        key: 'happy',
        kind: 'text',
        body: '花「R-really? Thank you... (ほ、ほんと？ありがとう…)」\n\n先輩は少し照れたようにうつむいた。',
        nextKey: 'end-good',
        order: 2,
      },
      {
        key: 'normal',
        kind: 'text',
        body: '花「Fufu, let\'s go get the tickets. (ふふ、チケット買いに行こっか)」\n\n自然な雰囲気で館内へ向かった。',
        nextKey: 'end-normal',
        order: 3,
      },
      {
        key: 'end-good',
        kind: 'end',
        body: '映画を観終わった後も、英語での感想戦はカフェで夕方まで続いた。',
        order: 4,
      },
      {
        key: 'end-normal',
        kind: 'end',
        body: '映画の字幕について教えてもらいながら、楽しい休日を過ごした。',
        order: 5,
      },
    ],
  },
  {
    slug: 'hana-cafe-english',
    characterId: 'hana',
    title: 'カフェで英語オーダー',
    synopsis: '外国人観光客が多いカフェで、英語での注文に挑戦！',
    unlockAffinity: 50,
    published: true,
    order: 40,
    scenes: [
      {
        key: 'open',
        kind: 'text',
        body: '話題の洋風カフェ。店員さんも外国人らしい。\n花「What would you like to order? I can help if you want. (何にする？手伝おうか？)」',
        nextKey: 'order',
        order: 0,
      },
      {
        key: 'order',
        kind: 'choice',
        body: 'よし、自分で注文に挑戦してみよう。',
        order: 1,
        choices: [
          { label: '「Can I have a coffee, please?」', affinityDelta: 5, nextKey: 'perfect', order: 0 },
          { label: '「This one, please.」', affinityDelta: 1, nextKey: 'good', order: 1 },
        ],
      },
      {
        key: 'perfect',
        kind: 'text',
        body: '花「Wow, perfect English! You\'ve been practicing, right? (完璧な英語だね！練習してたの？)」\n\n彼女は自分のことのように喜んでくれた。',
        nextKey: 'end-good',
        order: 2,
      },
      {
        key: 'good',
        kind: 'text',
        body: '花「Good job! Next time, try saying the item name! (よくできました！次は商品名を言ってみてね！)」\n\n優しくワンポイントアドバイスをくれた。',
        nextKey: 'end-normal',
        order: 3,
      },
      {
        key: 'end-good',
        kind: 'end',
        body: '少しずつ英語が上達しているのを感じる。彼女との距離も近づいている気がした。',
        order: 4,
      },
      {
        key: 'end-normal',
        kind: 'end',
        body: '緊張したけれど、彼女のサポートのおかげで無事にコーヒーが飲めた。',
        order: 5,
      },
    ],
  }
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
