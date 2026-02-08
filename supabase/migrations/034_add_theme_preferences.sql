-- ============================================
-- テーマ設定をプロフィールに追加
-- ユーザーの好みのテーマスタイルとカラーモードを保存
-- ============================================

-- テーマスタイル（modern/cottage）
alter table public.profiles add column if not exists theme_style text
  check (theme_style is null or theme_style in ('modern', 'cottage'));

-- カラーモード（light/dark/system）
alter table public.profiles add column if not exists color_mode text
  check (color_mode is null or color_mode in ('light', 'dark', 'system'));
