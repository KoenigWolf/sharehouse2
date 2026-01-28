import { useMemo } from "react";
import {
  createTranslator,
  DEFAULT_LOCALE,
  normalizeLocale,
  type Locale,
  type Translator,
} from "@/lib/i18n";

/**
 * クライアント側のロケールを検出する
 *
 * document.documentElement.lang → navigator.language の順に確認し、
 * サポート対象ロケールに正規化して返す。SSR時はデフォルトロケール(ja)を返す。
 *
 * @returns 検出されたロケール
 */
function detectClientLocale(): Locale {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang || navigator.language;
    return normalizeLocale(lang);
  }
  return DEFAULT_LOCALE;
}

/**
 * クライアントロケール取得フック
 *
 * コンポーネントで現在のロケールを取得する場合に使用する。
 * normalizeLocale を直接呼ぶ代わりにこのフックを使うこと。
 *
 * @param preferredLocale - 優先ロケール（省略時はクライアントロケールを自動検出）
 * @returns 現在のロケール
 */
export function useLocale(preferredLocale?: Locale): Locale {
  return preferredLocale ?? detectClientLocale();
}

/**
 * i18n翻訳フック
 *
 * ロケールに基づいた翻訳関数を返す。ロケールが変わらない限り
 * 翻訳関数はメモ化され再生成されない。
 *
 * @param preferredLocale - 優先ロケール（省略時はクライアントロケールを自動検出）
 * @returns ドットパス記法で翻訳文字列を取得する関数
 *
 * @example
 * ```tsx
 * const t = useI18n();
 * return <h1>{t("common.title")}</h1>;
 * ```
 */
export function useI18n(preferredLocale?: Locale): Translator {
  const locale = useLocale(preferredLocale);
  return useMemo(() => createTranslator(locale), [locale]);
}
