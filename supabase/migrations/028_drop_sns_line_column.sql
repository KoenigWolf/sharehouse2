-- LINE ログイン削除に伴い、未使用の sns_line カラムを削除
alter table public.profiles drop column if exists sns_line;
