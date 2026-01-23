import { Profile } from "@/types/profile";

// モダンなイラスト風アバター生成
const generateModernAvatar = (
  hairStyle: "short" | "medium" | "long" | "bob",
  hairColor: string,
  skinTone: string,
  bgColor: string,
  accentColor: string
) => {
  const hairPaths: Record<string, string> = {
    short: `
      <ellipse cx="50" cy="28" rx="22" ry="16" fill="${hairColor}"/>
      <rect x="28" y="26" width="44" height="8" fill="${hairColor}"/>
    `,
    medium: `
      <ellipse cx="50" cy="28" rx="24" ry="18" fill="${hairColor}"/>
      <rect x="26" y="26" width="48" height="20" fill="${hairColor}" rx="4"/>
    `,
    long: `
      <ellipse cx="50" cy="28" rx="26" ry="18" fill="${hairColor}"/>
      <path d="M24 30 Q20 50 24 75 L32 75 Q30 55 32 35 Z" fill="${hairColor}"/>
      <path d="M76 30 Q80 50 76 75 L68 75 Q70 55 68 35 Z" fill="${hairColor}"/>
    `,
    bob: `
      <ellipse cx="50" cy="28" rx="26" ry="18" fill="${hairColor}"/>
      <path d="M24 30 Q22 45 28 58 L36 55 Q32 45 34 35 Z" fill="${hairColor}"/>
      <path d="M76 30 Q78 45 72 58 L64 55 Q68 45 66 35 Z" fill="${hairColor}"/>
    `,
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="bg_${hairStyle}_${hairColor.slice(1)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bgColor}"/>
        <stop offset="100%" style="stop-color:${accentColor}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#bg_${hairStyle}_${hairColor.slice(1)})"/>

    <!-- 首 -->
    <rect x="42" y="68" width="16" height="12" fill="${skinTone}" rx="2"/>

    <!-- 服 -->
    <ellipse cx="50" cy="95" rx="28" ry="18" fill="${hairColor}" opacity="0.9"/>

    <!-- 顔 -->
    <ellipse cx="50" cy="48" rx="22" ry="26" fill="${skinTone}"/>

    <!-- 髪 -->
    ${hairPaths[hairStyle]}

    <!-- 眉 -->
    <path d="M38 40 Q42 38 46 40" stroke="#5c5c5c" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M54 40 Q58 38 62 40" stroke="#5c5c5c" stroke-width="1.5" fill="none" stroke-linecap="round"/>

    <!-- 目 -->
    <ellipse cx="42" cy="46" rx="3" ry="3.5" fill="#2d2d2d"/>
    <ellipse cx="58" cy="46" rx="3" ry="3.5" fill="#2d2d2d"/>
    <circle cx="43" cy="45" r="1" fill="#fff"/>
    <circle cx="59" cy="45" r="1" fill="#fff"/>

    <!-- 鼻 -->
    <path d="M50 50 L50 56" stroke="${skinTone}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>

    <!-- 口 -->
    <path d="M45 62 Q50 66 55 62" stroke="#c97878" stroke-width="2" fill="none" stroke-linecap="round"/>

    <!-- チーク -->
    <ellipse cx="34" cy="54" rx="5" ry="3" fill="#ffb4a2" opacity="0.4"/>
    <ellipse cx="66" cy="54" rx="5" ry="3" fill="#ffb4a2" opacity="0.4"/>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// アバターパターン
const avatarConfigs: Array<{
  hairStyle: "short" | "medium" | "long" | "bob";
  hairColor: string;
  skinTone: string;
  bgColor: string;
  accentColor: string;
}> = [
  { hairStyle: "long", hairColor: "#3d2314", skinTone: "#fce4d6", bgColor: "#e8f4f8", accentColor: "#d4e8f0" },
  { hairStyle: "short", hairColor: "#1a1a1a", skinTone: "#f5dcc8", bgColor: "#e8f0e8", accentColor: "#d4e8d4" },
  { hairStyle: "bob", hairColor: "#4a3020", skinTone: "#fce4d6", bgColor: "#f8f0f4", accentColor: "#f0e4ec" },
  { hairStyle: "short", hairColor: "#2d2d2d", skinTone: "#f0d4bc", bgColor: "#f4f4e8", accentColor: "#e8e8d8" },
  { hairStyle: "long", hairColor: "#5c3d2e", skinTone: "#fce4d6", bgColor: "#f0e8f4", accentColor: "#e4dce8" },
  { hairStyle: "short", hairColor: "#1a1a1a", skinTone: "#f5dcc8", bgColor: "#f8f4e8", accentColor: "#f0ecd8" },
  { hairStyle: "medium", hairColor: "#3d2820", skinTone: "#fce4d6", bgColor: "#f8e8ec", accentColor: "#f0dce4" },
  { hairStyle: "short", hairColor: "#2d2d2d", skinTone: "#f0d4bc", bgColor: "#e8f0f4", accentColor: "#dce8f0" },
  { hairStyle: "long", hairColor: "#4a3020", skinTone: "#fce4d6", bgColor: "#f0f8f0", accentColor: "#e4f0e4" },
  { hairStyle: "short", hairColor: "#1a1a1a", skinTone: "#f5dcc8", bgColor: "#f8f0e8", accentColor: "#f0e8dc" },
  { hairStyle: "bob", hairColor: "#3d2314", skinTone: "#fce4d6", bgColor: "#ece8f4", accentColor: "#e0dcec" },
  { hairStyle: "short", hairColor: "#2d2d2d", skinTone: "#f0d4bc", bgColor: "#f4f8e8", accentColor: "#ecf0dc" },
  { hairStyle: "medium", hairColor: "#5c3d2e", skinTone: "#fce4d6", bgColor: "#f8e4f0", accentColor: "#f0d8e8" },
  { hairStyle: "short", hairColor: "#1a1a1a", skinTone: "#f5dcc8", bgColor: "#e8f8f4", accentColor: "#dcf0ec" },
  { hairStyle: "long", hairColor: "#3d2820", skinTone: "#fce4d6", bgColor: "#f8f8e8", accentColor: "#f0f0dc" },
  { hairStyle: "short", hairColor: "#2d2d2d", skinTone: "#f0d4bc", bgColor: "#e4f0f8", accentColor: "#d8e8f4" },
  { hairStyle: "bob", hairColor: "#4a3020", skinTone: "#fce4d6", bgColor: "#f8e8f4", accentColor: "#f0dcea" },
  { hairStyle: "short", hairColor: "#1a1a1a", skinTone: "#f5dcc8", bgColor: "#f0f4e8", accentColor: "#e8ecdc" },
  { hairStyle: "medium", hairColor: "#3d2314", skinTone: "#fce4d6", bgColor: "#e8f8e8", accentColor: "#dcf0dc" },
  { hairStyle: "short", hairColor: "#2d2d2d", skinTone: "#f0d4bc", bgColor: "#f8f0f0", accentColor: "#f0e4e4" },
];

const avatars = avatarConfigs.map((config) =>
  generateModernAvatar(config.hairStyle, config.hairColor, config.skinTone, config.bgColor, config.accentColor)
);

export const mockProfiles: Profile[] = [
  // 2階
  {
    id: "mock-1",
    name: "田中 美咲",
    room_number: "201",
    bio: "IT企業でデザイナーをしています。休日はカフェ巡りが好きです。",
    avatar_url: avatars[0],
    interests: ["デザイン", "カフェ巡り", "写真"],
    move_in_date: "2024-01-15",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "mock-2",
    name: "佐藤 健太",
    room_number: "202",
    bio: "スタートアップでエンジニアやってます。最近は筋トレにハマってます。",
    avatar_url: avatars[1],
    interests: ["プログラミング", "筋トレ", "映画"],
    move_in_date: "2023-11-01",
    created_at: "2023-11-01T00:00:00Z",
    updated_at: "2023-11-01T00:00:00Z",
  },
  {
    id: "mock-3",
    name: "山本 さくら",
    room_number: "203",
    bio: "看護師をしています。料理が得意なので、たまにシェアキッチンでお菓子作ります！",
    avatar_url: avatars[2],
    interests: ["料理", "お菓子作り", "ヨガ"],
    move_in_date: "2024-03-01",
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z",
  },
  {
    id: "mock-4",
    name: "鈴木 大輔",
    room_number: "204",
    bio: "フリーランスのライターです。コーヒーと本が好き。",
    avatar_url: avatars[3],
    interests: ["読書", "コーヒー", "執筆"],
    move_in_date: "2023-08-15",
    created_at: "2023-08-15T00:00:00Z",
    updated_at: "2023-08-15T00:00:00Z",
  },
  {
    id: "mock-5",
    name: "伊藤 あかり",
    room_number: "205",
    bio: "大学院生です。研究の合間にランニングしてます。",
    avatar_url: avatars[4],
    interests: ["ランニング", "研究", "音楽"],
    move_in_date: "2024-04-01",
    created_at: "2024-04-01T00:00:00Z",
    updated_at: "2024-04-01T00:00:00Z",
  },
  // 3階
  {
    id: "mock-6",
    name: "渡辺 翔",
    room_number: "301",
    bio: "営業マンです。週末はフットサルチームで活動中！",
    avatar_url: avatars[5],
    interests: ["フットサル", "旅行", "お酒"],
    move_in_date: "2023-06-01",
    created_at: "2023-06-01T00:00:00Z",
    updated_at: "2023-06-01T00:00:00Z",
  },
  {
    id: "mock-7",
    name: "高橋 ゆい",
    room_number: "302",
    bio: "アパレルで働いてます。ファッションとアートが好き。",
    avatar_url: avatars[6],
    interests: ["ファッション", "アート", "カフェ巡り"],
    move_in_date: "2024-02-01",
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
  {
    id: "mock-8",
    name: "小林 拓海",
    room_number: "303",
    bio: "Webディレクターです。ボードゲーム会やりたい人募集中！",
    avatar_url: avatars[7],
    interests: ["ボードゲーム", "映画", "料理"],
    move_in_date: "2023-12-01",
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2023-12-01T00:00:00Z",
  },
  {
    id: "mock-9",
    name: "加藤 美月",
    room_number: "304",
    bio: "ヨガインストラクターしてます。朝ヨガ一緒にやりませんか？",
    avatar_url: avatars[8],
    interests: ["ヨガ", "瞑想", "健康"],
    move_in_date: "2024-01-01",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "mock-10",
    name: "吉田 隼人",
    room_number: "305",
    bio: "メーカーで商品企画してます。DIYと観葉植物が趣味。",
    avatar_url: avatars[9],
    interests: ["DIY", "観葉植物", "キャンプ"],
    move_in_date: "2023-09-15",
    created_at: "2023-09-15T00:00:00Z",
    updated_at: "2023-09-15T00:00:00Z",
  },
  // 4階
  {
    id: "mock-11",
    name: "中村 凛",
    room_number: "401",
    bio: "イラストレーターです。猫を飼ってます（ルナちゃん）。",
    avatar_url: avatars[10],
    interests: ["イラスト", "猫", "アニメ"],
    move_in_date: "2023-10-01",
    created_at: "2023-10-01T00:00:00Z",
    updated_at: "2023-10-01T00:00:00Z",
  },
  {
    id: "mock-12",
    name: "木村 誠",
    room_number: "402",
    bio: "会計士です。週末は釣りに行ってます。",
    avatar_url: avatars[11],
    interests: ["釣り", "料理", "日本酒"],
    move_in_date: "2023-07-01",
    created_at: "2023-07-01T00:00:00Z",
    updated_at: "2023-07-01T00:00:00Z",
  },
  {
    id: "mock-13",
    name: "林 彩花",
    room_number: "403",
    bio: "マーケティング会社勤務。韓国ドラマにハマってます。",
    avatar_url: avatars[12],
    interests: ["韓国ドラマ", "K-POP", "旅行"],
    move_in_date: "2024-05-01",
    created_at: "2024-05-01T00:00:00Z",
    updated_at: "2024-05-01T00:00:00Z",
  },
  {
    id: "mock-14",
    name: "斎藤 悠太",
    room_number: "404",
    bio: "音楽プロデューサーです。ギター弾ける人セッションしましょう！",
    avatar_url: avatars[13],
    interests: ["音楽", "ギター", "作曲"],
    move_in_date: "2023-05-15",
    created_at: "2023-05-15T00:00:00Z",
    updated_at: "2023-05-15T00:00:00Z",
  },
  {
    id: "mock-15",
    name: "松本 愛",
    room_number: "405",
    bio: "保育士です。子どもと動物が大好き！",
    avatar_url: avatars[14],
    interests: ["動物", "散歩", "映画"],
    move_in_date: "2024-03-15",
    created_at: "2024-03-15T00:00:00Z",
    updated_at: "2024-03-15T00:00:00Z",
  },
  // 5階
  {
    id: "mock-16",
    name: "井上 蓮",
    room_number: "501",
    bio: "データサイエンティストです。統計とコーヒーが好き。",
    avatar_url: avatars[15],
    interests: ["データ分析", "コーヒー", "読書"],
    move_in_date: "2023-11-15",
    created_at: "2023-11-15T00:00:00Z",
    updated_at: "2023-11-15T00:00:00Z",
  },
  {
    id: "mock-17",
    name: "山田 ひなた",
    room_number: "502",
    bio: "翻訳者です。英語と中国語できます。語学交換しませんか？",
    avatar_url: avatars[16],
    interests: ["語学", "読書", "旅行"],
    move_in_date: "2024-02-15",
    created_at: "2024-02-15T00:00:00Z",
    updated_at: "2024-02-15T00:00:00Z",
  },
  {
    id: "mock-18",
    name: "中島 陽介",
    room_number: "503",
    bio: "建築士です。休日は美術館巡りしてます。",
    avatar_url: avatars[17],
    interests: ["建築", "アート", "写真"],
    move_in_date: "2023-08-01",
    created_at: "2023-08-01T00:00:00Z",
    updated_at: "2023-08-01T00:00:00Z",
  },
  {
    id: "mock-19",
    name: "藤田 真央",
    room_number: "504",
    bio: "バリスタしてます。美味しいコーヒー淹れますよ！",
    avatar_url: avatars[18],
    interests: ["コーヒー", "ラテアート", "音楽"],
    move_in_date: "2024-04-15",
    created_at: "2024-04-15T00:00:00Z",
    updated_at: "2024-04-15T00:00:00Z",
  },
  {
    id: "mock-20",
    name: "岡田 颯太",
    room_number: "505",
    bio: "動画クリエイターです。シェアハウスの動画作りたい！",
    avatar_url: avatars[19],
    interests: ["動画編集", "カメラ", "ゲーム"],
    move_in_date: "2024-06-01",
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2024-06-01T00:00:00Z",
  },
];
