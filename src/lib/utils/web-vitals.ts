/**
 * Web Vitals パフォーマンス監視ユーティリティ
 *
 * Core Web Vitals (LCP, FID, CLS) と補助メトリクス (FCP, TTFB, INP) を
 * 収集し、設定された送信先にレポートする。
 *
 * Sentry統合時は自動的にSentryにもメトリクスが送信される。
 * 追加のカスタムエンドポイントへの送信も可能。
 */

import type { Metric } from "web-vitals";
import { logError } from "@/lib/errors";

/**
 * Web Vitalsメトリクスの閾値（Googleの推奨値）
 *
 * @see https://web.dev/vitals/
 */
const WEB_VITALS_THRESHOLDS = {
  /** Largest Contentful Paint: 良好 < 2.5s、要改善 < 4s */
  LCP: { good: 2500, needsImprovement: 4000 },
  /** Cumulative Layout Shift: 良好 < 0.1、要改善 < 0.25 */
  CLS: { good: 0.1, needsImprovement: 0.25 },
  /** First Contentful Paint: 良好 < 1.8s、要改善 < 3s */
  FCP: { good: 1800, needsImprovement: 3000 },
  /** Time to First Byte: 良好 < 800ms、要改善 < 1800ms */
  TTFB: { good: 800, needsImprovement: 1800 },
  /** Interaction to Next Paint: 良好 < 200ms、要改善 < 500ms */
  INP: { good: 200, needsImprovement: 500 },
} as const;

type MetricName = keyof typeof WEB_VITALS_THRESHOLDS;

const VALID_METRIC_NAMES = Object.keys(WEB_VITALS_THRESHOLDS) as MetricName[];

function isValidMetricName(name: string): name is MetricName {
  return VALID_METRIC_NAMES.includes(name as MetricName);
}

/**
 * メトリクス値の評価を返す
 *
 * @param name - メトリクス名
 * @param value - 測定値
 * @returns "good" | "needs-improvement" | "poor"
 */
function rateMetric(
  name: MetricName,
  value: number
): "good" | "needs-improvement" | "poor" {
  const threshold = WEB_VITALS_THRESHOLDS[name];

  if (value <= threshold.good) return "good";
  if (value <= threshold.needsImprovement) return "needs-improvement";
  return "poor";
}

/**
 * Web Vitalsメトリクスをコンソールにレポートする（開発用）
 *
 * @param metric - web-vitals ライブラリから取得したメトリクス
 */
function reportToConsole(metric: Metric): void {
  if (!isValidMetricName(metric.name)) {
    logError(new Error(`Unknown web-vitals metric: ${metric.name}`), {
      action: "web-vitals:reportToConsole",
      metadata: { metricName: metric.name },
    });
    return;
  }

  const rating = rateMetric(metric.name, metric.value);

  const style =
    rating === "good"
      ? "color: #0cce6b"
      : rating === "needs-improvement"
        ? "color: #ffa400"
        : "color: #ff4e42";

  console.log(
    `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(metric.name === "CLS" ? 3 : 0)} (${rating})`,
    style
  );
}

/**
 * Web Vitalsメトリクスをカスタムエンドポイントにレポートする
 *
 * Navigator.sendBeacon API を使用してページ離脱時でも確実にデータを送信する。
 *
 * @param metric - web-vitals ライブラリから取得したメトリクス
 * @param endpoint - 送信先URL（省略時はレポートしない）
 */
function reportToEndpoint(metric: Metric, endpoint?: string): void {
  if (!endpoint) return;

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    timestamp: Date.now(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body);
  } else {
    fetch(endpoint, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch((err) => {
      logError(err, { action: "web-vitals:sendMetrics" });
    });
  }
}

/**
 * 全Web Vitalsメトリクスの収集を開始する
 *
 * web-vitals ライブラリを動的インポートし、各メトリクスのコールバックを登録する。
 * 開発環境ではコンソールにも出力する。
 *
 * @param options.endpoint - メトリクス送信先URL（省略可）
 */
export async function initWebVitals(options?: {
  endpoint?: string;
}): Promise<void> {
  try {
    const { onLCP, onCLS, onFCP, onTTFB, onINP } = await import(
      "web-vitals"
    );

    const handleMetric = (metric: Metric) => {
      if (process.env.NODE_ENV === "development") {
        reportToConsole(metric);
      }
      reportToEndpoint(metric, options?.endpoint);
    };

    onLCP(handleMetric);
    onCLS(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
  } catch (err) {
    logError(err, { action: "web-vitals:init" });
  }
}
