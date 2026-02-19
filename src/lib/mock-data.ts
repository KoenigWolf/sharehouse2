import { Profile } from "@/domain/profile";
import type { BulletinWithProfile } from "@/domain/bulletin";
import type { EventWithDetails } from "@/domain/event";
import type { ShareItemWithProfile } from "@/domain/share-item";
import type { PhotoWithProfile } from "@/domain/room-photo";

/**
 * DESIGN_GUIDELINES.md準拠のミニマルなアバター生成
 * - 背景: zinc スケールの落ち着いた色
 * - 人物: シンプルな線画風
 * - 色: 低彩度、ニュートラルトーン
 */
/**
 * DESIGN_GUIDELINES.md準拠のモダンでプレミアムなアバター生成
 * - 抽象的なグラデーションとシェイプを使用
 * - 鮮やかだが落ち着いた色味（Vibrant & Premium）
 * - "未登録" 感を出しつつも、プレースホルダーとして美しいデザイン
 */
/**
 * DESIGN_GUIDELINES.md準拠のモノクローム人型アイコン
 * - 背景: 落ち着いたグレー
 * - 人物: シンプルなシルエット
 * - 色: モノクローム（プレミアム感のある無機質さ）
 */
const generateMonochromeHumanAvatar = (seed: number) => {
  // 微妙に異なるグレーのバリエーション（完全に同じだと単調すぎるため）
  const bgs = ["#f4f4f5", "#e4e4e7", "#d4d4d8", "#fafafa", "#f5f5f5"];
  const bg = bgs[seed % bgs.length];
  const fg = "#a1a1aa"; // Neutral-400

  // シンプルな人型シルエットアイコン
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" fill="${bg}" />
    
    <!-- 頭部 -->
    <circle cx="50" cy="40" r="18" fill="${fg}" />
    
    <!-- 身体（半円形） -->
    <path d="M20 90 C20 70 30 60 50 60 C70 60 80 70 80 90 V100 H20 V90 Z" fill="${fg}" />
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const avatars = Array.from({ length: 20 }, (_, i) => generateMonochromeHumanAvatar(i));


export const mockProfiles: Profile[] = [
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

/**
 * Generate mock bulletins for unauthenticated teaser display
 * Uses generic placeholder content to avoid leaking real data
 *
 * NOTE: Hardcoded Japanese is acceptable here because:
 * 1. Content is blurred and not meant to be read
 * 2. i18n requires async which would break sync API
 * 3. Primary audience (Japanese sharehouse) expects Japanese placeholders
 */
export function generateMockBulletins(count: number): BulletinWithProfile[] {
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `mock-bulletin-${i}`,
    user_id: `mock-${i + 1}`,
    message: "これはサンプルメッセージです。ログインすると実際の投稿が表示されます。",
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    updated_at: new Date(Date.now() - i * 3600000).toISOString(),
    profiles: {
      name: mockProfiles[i % mockProfiles.length].name,
      nickname: null,
      avatar_url: mockProfiles[i % mockProfiles.length].avatar_url,
      room_number: mockProfiles[i % mockProfiles.length].room_number,
    },
  }));
}

/**
 * Generate mock events for unauthenticated teaser display
 */
export function generateMockEvents(count: number): EventWithDetails[] {
  const futureDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split("T")[0];
  };

  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `mock-event-${i}`,
    user_id: `mock-${i + 1}`,
    title: "サンプルイベント",
    description: "これはサンプルイベントです。ログインすると詳細が表示されます。",
    event_date: futureDate(i * 7 + 1),
    event_time: "19:00",
    location: "共有スペース",
    cover_image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      name: mockProfiles[i % mockProfiles.length].name,
      nickname: null,
      avatar_url: mockProfiles[i % mockProfiles.length].avatar_url,
    },
    event_attendees: [],
  }));
}

/**
 * Generate mock share items for unauthenticated teaser display
 */
export function generateMockShareItems(count: number): ShareItemWithProfile[] {
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `mock-share-${i}`,
    user_id: `mock-${i + 1}`,
    title: "サンプルアイテム",
    description: "これはサンプルです。ログインすると詳細が表示されます。",
    image_url: null,
    status: "available" as const,
    claimed_by: null,
    expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      name: mockProfiles[i % mockProfiles.length].name,
      nickname: null,
      avatar_url: mockProfiles[i % mockProfiles.length].avatar_url,
      room_number: mockProfiles[i % mockProfiles.length].room_number,
    },
  }));
}

// Pre-computed placeholder for room photos (avoid re-encoding on each call)
const PLACEHOLDER_ROOM_PHOTO = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
    <rect width="400" height="300" fill="#f4f4f5"/>
    <rect x="150" y="100" width="100" height="80" rx="8" fill="#d4d4d8"/>
    <circle cx="180" cy="130" r="15" fill="#a1a1aa"/>
    <path d="M150 180 L200 140 L250 180" stroke="#a1a1aa" stroke-width="3" fill="none"/>
  </svg>
`)}`;

/**
 * Generate mock room photos for unauthenticated teaser display
 * Uses placeholder image to avoid leaking real photos
 */
export function generateMockRoomPhotos(count: number): PhotoWithProfile[] {
  return Array.from({ length: Math.min(count, 6) }, (_, i) => ({
    id: `mock-photo-${i}`,
    user_id: `mock-${i + 1}`,
    photo_url: PLACEHOLDER_ROOM_PHOTO,
    caption: null,
    taken_at: null,
    display_order: i,
    created_at: new Date().toISOString(),
    profile: {
      id: `mock-${i + 1}`,
      name: mockProfiles[i % mockProfiles.length].name,
      avatar_url: mockProfiles[i % mockProfiles.length].avatar_url,
    },
  }));
}
