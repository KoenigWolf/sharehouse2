-- ============================================
-- Wi-Fi 情報・共用情報のシードデータ
-- ============================================

-- Wi-Fi テーブルに階数カラムを追加
alter table public.wifi_info add column if not exists floor smallint;

-- Wi-Fi 情報をクリアして最新データに置き換え
delete from public.wifi_info;

-- 5F Wi-Fi（親機①・親機②・中継機 すべて同一パスワード）
insert into public.wifi_info (floor, area_name, ssid, password, display_order)
values
  (5, '2.4GHz', 'Yamamomo-1', 'Koishikawa190808', 1),
  (5, '2.4GHz', 'Yamamomo-2', 'Koishikawa190808', 2),
  (5, '5GHz', 'Yamamomo-3', 'Koishikawa190808', 3);

-- 他の階のWi-Fi情報（判明次第追加）
-- insert into public.wifi_info (floor, area_name, ssid, password, display_order)
-- values
--   (2, '2F アクセスポイント', 'SSID', 'password', 1);
--   (3, '3F アクセスポイント', 'SSID', 'password', 1);
--   (4, '4F アクセスポイント', 'SSID', 'password', 1);

-- ============================================
-- 共用情報テーブル作成
-- ============================================

create table if not exists public.shared_info (
  id uuid default gen_random_uuid() primary key,
  info_key text unique not null,
  title text not null,
  content text not null,
  notes text,
  display_order smallint default 0 not null,
  updated_by uuid references auth.users(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- トリガーが存在しない場合のみ作成
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_shared_info_updated'
  ) then
    create trigger on_shared_info_updated
      before update on public.shared_info
      for each row execute function public.handle_updated_at();
  end if;
end $$;

alter table public.shared_info enable row level security;

-- ポリシーが存在しない場合のみ作成
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'shared_info' and policyname = '認証済みユーザーは共用情報を閲覧可能'
  ) then
    create policy "認証済みユーザーは共用情報を閲覧可能"
      on public.shared_info for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'shared_info' and policyname = '管理者のみ共用情報を作成可能'
  ) then
    create policy "管理者のみ共用情報を作成可能"
      on public.shared_info for insert to authenticated
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'shared_info' and policyname = '管理者のみ共用情報を更新可能'
  ) then
    create policy "管理者のみ共用情報を更新可能"
      on public.shared_info for update to authenticated
      using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'shared_info' and policyname = '管理者のみ共用情報を削除可能'
  ) then
    create policy "管理者のみ共用情報を削除可能"
      on public.shared_info for delete to authenticated
      using (public.is_admin());
  end if;
end $$;

-- 既存データをクリアして新規挿入
delete from public.shared_info;

-- 郵便受け解錠番号
insert into public.shared_info (info_key, title, content, notes, display_order)
values (
  'mailbox_code',
  '郵便受けの解錠番号',
  '左へ2回 4 右へ8',
  '「448」で覚えてください',
  1
);

-- 住所情報
insert into public.shared_info (info_key, title, content, notes, display_order)
values (
  'address',
  '住所',
  '東京都 文京区 白山3丁目 3番 4号 田中ビル5F',
  2
);

-- Wi-Fi注意事項
insert into public.shared_info (info_key, title, content, notes, display_order)
values (
  'wifi_note',
  'Wi-Fi利用上の注意',
  'SSIDは隠蔽されているため、各自のデバイスから手動で検索してください。セキュリティはWPA2です。',
  '自室に別途Wi-Fiルーターを設置すると混線するため、極力設置は避けてください',
  3
);

-- ============================================
-- ゴミ出しスケジュール更新（文京区白山3丁目）
-- 出典: https://www.city.bunkyo.lg.jp/b039/p000926/
-- ============================================

delete from public.garbage_schedule;

-- 月曜: 資源（新聞・雑誌・段ボール・びん・缶・ペットボトル）
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('資源', 1, '新聞・雑誌・段ボール・びん・缶・ペットボトル／朝8時までに集積所へ', 1);

-- 水曜: 可燃ごみ
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('可燃ごみ', 3, '朝8時までに集積所へ', 2);

-- 木曜: 資源プラスチック
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('資源プラスチック', 4, '朝8時までに集積所へ', 3);

-- 金曜: 不燃ごみ（第1・第3のみ）
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('不燃ごみ', 5, '第1・第3金曜日のみ／朝8時までに集積所へ', 4);

-- 土曜: 可燃ごみ
insert into public.garbage_schedule (garbage_type, day_of_week, notes, display_order)
values ('可燃ごみ', 6, '朝8時までに集積所へ', 5);
