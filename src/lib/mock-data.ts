import { Profile } from "@/domain/profile";

/**
 * DESIGN_GUIDELINES.md準拠のミニマルなアバター生成
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

// DESIGN_GUIDELINES.md準拠のカラーパレット（低彩度）
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
    name: "サンプル ユーザーA",
    room_number: "201",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[0],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "INFP",
    is_admin: false,
    move_in_date: "2024-01-15",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "mock-2",
    name: "サンプル ユーザーB",
    room_number: "202",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[1],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "INTJ",
    is_admin: false,
    move_in_date: "2023-11-01",
    created_at: "2023-11-01T00:00:00Z",
    updated_at: "2023-11-01T00:00:00Z",
  },
  {
    id: "mock-3",
    name: "サンプル ユーザーC",
    room_number: "203",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[2],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ESFJ",
    is_admin: false,
    move_in_date: "2024-03-01",
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z",
  },
  {
    id: "mock-4",
    name: "サンプル ユーザーD",
    room_number: "204",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[3],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "INTP",
    is_admin: false,
    move_in_date: "2023-08-15",
    created_at: "2023-08-15T00:00:00Z",
    updated_at: "2023-08-15T00:00:00Z",
  },
  {
    id: "mock-5",
    name: "サンプル ユーザーE",
    room_number: "205",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[4],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ISTJ",
    is_admin: false,
    move_in_date: "2024-04-01",
    created_at: "2024-04-01T00:00:00Z",
    updated_at: "2024-04-01T00:00:00Z",
  },
  // 3階
  {
    id: "mock-6",
    name: "サンプル ユーザーF",
    room_number: "301",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[5],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ESTP",
    is_admin: false,
    move_in_date: "2023-06-01",
    created_at: "2023-06-01T00:00:00Z",
    updated_at: "2023-06-01T00:00:00Z",
  },
  {
    id: "mock-7",
    name: "サンプル ユーザーG",
    room_number: "302",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[6],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ENFP",
    is_admin: false,
    move_in_date: "2024-02-01",
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
  {
    id: "mock-8",
    name: "サンプル ユーザーH",
    room_number: "303",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[7],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ENTP",
    is_admin: false,
    move_in_date: "2023-12-01",
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2023-12-01T00:00:00Z",
  },
  {
    id: "mock-9",
    name: "サンプル ユーザーI",
    room_number: "304",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[8],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ISFJ",
    is_admin: false,
    move_in_date: "2024-01-01",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "mock-10",
    name: "サンプル ユーザーJ",
    room_number: "305",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[9],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ISTP",
    is_admin: false,
    move_in_date: "2023-09-15",
    created_at: "2023-09-15T00:00:00Z",
    updated_at: "2023-09-15T00:00:00Z",
  },
  // 4階
  {
    id: "mock-11",
    name: "サンプル ユーザーK",
    room_number: "401",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[10],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "INFJ",
    is_admin: false,
    move_in_date: "2023-10-01",
    created_at: "2023-10-01T00:00:00Z",
    updated_at: "2023-10-01T00:00:00Z",
  },
  {
    id: "mock-12",
    name: "サンプル ユーザーL",
    room_number: "402",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[11],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ESTJ",
    is_admin: false,
    move_in_date: "2023-07-01",
    created_at: "2023-07-01T00:00:00Z",
    updated_at: "2023-07-01T00:00:00Z",
  },
  {
    id: "mock-13",
    name: "サンプル ユーザーM",
    room_number: "403",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[12],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ESFP",
    is_admin: false,
    move_in_date: "2024-05-01",
    created_at: "2024-05-01T00:00:00Z",
    updated_at: "2024-05-01T00:00:00Z",
  },
  {
    id: "mock-14",
    name: "サンプル ユーザーN",
    room_number: "404",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[13],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ISFP",
    is_admin: false,
    move_in_date: "2023-05-15",
    created_at: "2023-05-15T00:00:00Z",
    updated_at: "2023-05-15T00:00:00Z",
  },
  {
    id: "mock-15",
    name: "サンプル ユーザーO",
    room_number: "405",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[14],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ENFJ",
    is_admin: false,
    move_in_date: "2024-03-15",
    created_at: "2024-03-15T00:00:00Z",
    updated_at: "2024-03-15T00:00:00Z",
  },
  // 5階
  {
    id: "mock-16",
    name: "サンプル ユーザーP",
    room_number: "501",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[15],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "INTJ",
    is_admin: false,
    move_in_date: "2023-11-15",
    created_at: "2023-11-15T00:00:00Z",
    updated_at: "2023-11-15T00:00:00Z",
  },
  {
    id: "mock-17",
    name: "サンプル ユーザーQ",
    room_number: "502",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[16],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "INFP",
    is_admin: false,
    move_in_date: "2024-02-15",
    created_at: "2024-02-15T00:00:00Z",
    updated_at: "2024-02-15T00:00:00Z",
  },
  {
    id: "mock-18",
    name: "サンプル ユーザーR",
    room_number: "503",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[17],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "INTP",
    is_admin: false,
    move_in_date: "2023-08-01",
    created_at: "2023-08-01T00:00:00Z",
    updated_at: "2023-08-01T00:00:00Z",
  },
  {
    id: "mock-19",
    name: "サンプル ユーザーS",
    room_number: "504",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[18],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ESFJ",
    is_admin: false,
    move_in_date: "2024-04-15",
    created_at: "2024-04-15T00:00:00Z",
    updated_at: "2024-04-15T00:00:00Z",
  },
  {
    id: "mock-20",
    name: "サンプル ユーザーT",
    room_number: "505",
    bio: "これはサンプルデータです。実際の住人が登録すると置き換わります。",
    avatar_url: avatars[19],
    interests: ["サンプル趣味1", "サンプル趣味2"],
    mbti: "ENTP",
    is_admin: false,
    move_in_date: "2024-06-01",
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2024-06-01T00:00:00Z",
  },
];
