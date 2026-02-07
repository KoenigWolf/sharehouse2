-- ============================================
-- bulletins: 複数投稿を許可（Twitter型）
-- user_id の UNIQUE 制約を削除
-- ============================================

-- UNIQUE 制約を削除（複数投稿を許可）
alter table public.bulletins
  drop constraint if exists bulletins_user_id_key;

-- インデックス追加（user_id での検索を高速化）
create index if not exists bulletins_user_id_idx
  on public.bulletins(user_id);

-- updated_at での並び替え用インデックス
create index if not exists bulletins_updated_at_idx
  on public.bulletins(updated_at desc);
