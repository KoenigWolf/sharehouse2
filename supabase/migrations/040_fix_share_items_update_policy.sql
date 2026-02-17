-- ============================================
-- Fix: Share Items UPDATE ポリシーのセキュリティ強化
--
-- 問題: 既存ポリシーでは任意の認証ユーザーが "available" 状態の
--       アイテムを自由に更新可能だった
-- 修正: 所有者のみ自由に更新可、他ユーザーは自分への claim のみ許可
-- ============================================

-- 既存の脆弱なポリシーを削除
drop policy if exists "Shareの更新ポリシー" on public.share_items;

-- 新しいセキュアなポリシーを作成
-- 条件:
--   1. 所有者 (user_id = auth.uid()) は自由に更新可能
--   2. 他ユーザーは available のアイテムを自分宛てに claim する場合のみ更新可能
create policy "Shareの更新ポリシー"
  on public.share_items for update to authenticated
  using (
    -- 読み取り条件: 所有者か、available 状態のアイテム
    auth.uid() = user_id OR status = 'available'
  )
  with check (
    -- 書き込み条件:
    -- 1. 所有者は自由に更新可
    -- 2. 非所有者は claimed_by を自分に設定する場合のみ許可
    auth.uid() = user_id OR (
      claimed_by = auth.uid() AND
      status = 'claimed'
    )
  );

-- コメント追加
comment on policy "Shareの更新ポリシー" on public.share_items is
  '所有者は自由に更新可。他ユーザーは available のアイテムを自分宛てに claim する場合のみ更新可能。';
