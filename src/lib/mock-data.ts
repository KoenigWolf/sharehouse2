import { Profile } from "@/domain/profile";

/**
 * DESIGN.md準拠のミニマルなアバター生成
 * - 背景: 生成り系の落ち着いた色（#f5f5f3, #fafaf8）
 * - 人物: シンプルな線画風
 * - 色: 低彩度、静かなトーン
 */
const generateMinimalAvatar = (
  variant: "a" | "b" | "c" | "d",
  hairColor: string,
  clothesColor: string
) => {
  // 背景パターン（生成り系、わずかな違い）
  const bgColors: Record<string, string> = {
    a: "#f5f5f3",
    b: "#f8f8f6",
    c: "#f3f3f1",
    d: "#fafaf8",
  };

  const bg = bgColors[variant];
  const skinTone = "#f0e6dc"; // 統一された肌色（温かみのあるベージュ）

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <!-- 背景 -->
    <rect width="100" height="100" fill="${bg}"/>

    <!-- 首 -->
    <rect x="44" y="66" width="12" height="10" fill="${skinTone}"/>

    <!-- 服（シンプルな形） -->
    <path d="M30 100 Q30 78 50 76 Q70 78 70 100 Z" fill="${clothesColor}"/>

    <!-- 顔 -->
    <ellipse cx="50" cy="48" rx="20" ry="24" fill="${skinTone}"/>

    <!-- 髪（シンプル） -->
    ${
      variant === "a" || variant === "c"
        ? `<ellipse cx="50" cy="30" rx="21" ry="14" fill="${hairColor}"/>
         <rect x="29" y="28" width="42" height="12" fill="${hairColor}"/>`
        : variant === "b"
          ? `<ellipse cx="50" cy="30" rx="22" ry="14" fill="${hairColor}"/>
         <path d="M28 32 Q26 50 30 65 L36 62 Q34 48 36 36 Z" fill="${hairColor}"/>
         <path d="M72 32 Q74 50 70 65 L64 62 Q66 48 64 36 Z" fill="${hairColor}"/>`
          : `<ellipse cx="50" cy="30" rx="22" ry="14" fill="${hairColor}"/>
         <path d="M28 32 Q26 45 32 55 L38 52 Q34 44 36 36 Z" fill="${hairColor}"/>
         <path d="M72 32 Q74 45 68 55 L62 52 Q66 44 64 36 Z" fill="${hairColor}"/>`
    }

    <!-- 目（シンプルな点） -->
    <circle cx="42" cy="48" r="2.5" fill="#4a4a4a"/>
    <circle cx="58" cy="48" r="2.5" fill="#4a4a4a"/>

    <!-- 口（控えめな線） -->
    <path d="M46 58 Q50 61 54 58" stroke="#c9a090" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// DESIGN.md準拠のカラーパレット（低彩度）
const avatarConfigs: Array<{
  variant: "a" | "b" | "c" | "d";
  hairColor: string;
  clothesColor: string;
}> = [
  // 髪色: 暗めの茶〜黒系（#3d3530, #4a4540, #2d2a28）
  // 服: 落ち着いたグレー・ベージュ系（#d4d4d4, #c9c5c0, #b8b4b0）
  { variant: "b", hairColor: "#3d3530", clothesColor: "#d4d4d4" },
  { variant: "a", hairColor: "#2d2a28", clothesColor: "#c9c5c0" },
  { variant: "d", hairColor: "#4a4540", clothesColor: "#d8d4d0" },
  { variant: "a", hairColor: "#3a3632", clothesColor: "#ccc8c4" },
  { variant: "b", hairColor: "#454140", clothesColor: "#d0ccc8" },
  { variant: "a", hairColor: "#2d2a28", clothesColor: "#dcd8d4" },
  { variant: "c", hairColor: "#3d3530", clothesColor: "#c5c1bc" },
  { variant: "a", hairColor: "#4a4540", clothesColor: "#d4d0cc" },
  { variant: "b", hairColor: "#3a3632", clothesColor: "#ccc8c4" },
  { variant: "a", hairColor: "#2d2a28", clothesColor: "#d8d4d0" },
  { variant: "d", hairColor: "#454140", clothesColor: "#c9c5c0" },
  { variant: "a", hairColor: "#3d3530", clothesColor: "#d0ccc8" },
  { variant: "c", hairColor: "#3a3632", clothesColor: "#dcd8d4" },
  { variant: "a", hairColor: "#2d2a28", clothesColor: "#c5c1bc" },
  { variant: "b", hairColor: "#4a4540", clothesColor: "#d4d0cc" },
  { variant: "a", hairColor: "#454140", clothesColor: "#ccc8c4" },
  { variant: "d", hairColor: "#3d3530", clothesColor: "#d8d4d0" },
  { variant: "a", hairColor: "#3a3632", clothesColor: "#c9c5c0" },
  { variant: "c", hairColor: "#2d2a28", clothesColor: "#d0ccc8" },
  { variant: "a", hairColor: "#4a4540", clothesColor: "#dcd8d4" },
];

const avatars = avatarConfigs.map((config) =>
  generateMinimalAvatar(config.variant, config.hairColor, config.clothesColor)
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
