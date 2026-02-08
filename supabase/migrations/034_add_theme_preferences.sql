-- ============================================
-- テーマ設定をプロフィールに追加
-- ユーザーの好みのテーマスタイルとカラーモードを保存
-- ============================================

-- テーマスタイル（modern/cottage）
alter table public.profiles add column if not exists theme_style text;

-- カラーモード（light/dark/system）
alter table public.profiles add column if not exists color_mode text;
