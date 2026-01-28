-- ============================================
-- 部屋写真テーブル作成
-- ============================================

create table public.room_photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  photo_url text not null,
  caption text,
  display_order smallint default 0 not null,
  created_at timestamptz default now() not null
);

create index room_photos_user_id_idx on public.room_photos(user_id);
create index room_photos_created_at_idx on public.room_photos(created_at desc);

alter table public.room_photos enable row level security;

create policy "認証済みユーザーは部屋写真を閲覧可能"
  on public.room_photos for select to authenticated using (true);

create policy "自分の部屋写真のみアップロード可能"
  on public.room_photos for insert to authenticated
  with check (auth.uid() = user_id);

create policy "自分の部屋写真のみ更新可能"
  on public.room_photos for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "自分の部屋写真のみ削除可能"
  on public.room_photos for delete to authenticated
  using (auth.uid() = user_id);

-- Storage バケット
-- Supabase Dashboard で room-photos バケットを作成（Public: ON）後、以下を実行

create policy "部屋写真は誰でも閲覧可能"
  on storage.objects for select
  using (bucket_id = 'room-photos');

create policy "認証済みユーザーは部屋写真をアップロード可能"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'room-photos');

create policy "自分の部屋写真のみ更新可能_storage"
  on storage.objects for update to authenticated
  using (bucket_id = 'room-photos');

create policy "自分の部屋写真のみ削除可能_storage"
  on storage.objects for delete to authenticated
  using (bucket_id = 'room-photos');
