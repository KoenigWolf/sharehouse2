-- ============================================
-- シェアハウス住民ポータル: プロフィールテーブル
-- ============================================

-- profiles テーブル作成
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  room_number text,
  bio text,
  avatar_url text,
  interests text[] default '{}',
  move_in_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- updated_at 自動更新用トリガー関数
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- updated_at トリガー
create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- 新規ユーザー登録時に profiles レコードを自動作成するトリガー関数
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$ language plpgsql security definer;

-- auth.users への INSERT 時にトリガー実行
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

-- RLS を有効化
alter table public.profiles enable row level security;

-- SELECT: 認証済みユーザーは全プロフィールを閲覧可能
create policy "認証済みユーザーは全プロフィールを閲覧可能"
  on public.profiles
  for select
  to authenticated
  using (true);

-- INSERT: 自分のプロフィールのみ作成可能
create policy "自分のプロフィールのみ作成可能"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- UPDATE: 自分のプロフィールのみ編集可能
create policy "自分のプロフィールのみ編集可能"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================
-- Storage バケット設定（アバター画像用）
-- ============================================

-- avatars バケット作成
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Storage RLS ポリシー: 認証済みユーザーは閲覧可能
create policy "アバター画像は誰でも閲覧可能"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'avatars');

-- Storage RLS ポリシー: 自分のアバターのみアップロード可能
create policy "自分のアバターのみアップロード可能"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS ポリシー: 自分のアバターのみ更新可能
create policy "自分のアバターのみ更新可能"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS ポリシー: 自分のアバターのみ削除可能
create policy "自分のアバターのみ削除可能"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
