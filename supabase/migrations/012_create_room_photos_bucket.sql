-- ============================================
-- room-photos ストレージバケット作成
-- ============================================

-- バケット作成（存在しない場合のみ）
insert into storage.buckets (id, name, public)
values ('room-photos', 'room-photos', true)
on conflict (id) do nothing;
