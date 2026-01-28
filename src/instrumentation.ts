/**
 * Next.js Instrumentation Hook
 *
 * Sentry のサーバーサイド/エッジランタイム初期化を行う。
 * Next.js 16 の instrumentation API を使用。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export async function onRequestError(
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
    renderSource: string;
    revalidateReason: string | undefined;
    renderType: string;
  }
): Promise<void> {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(error, {
    tags: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    extra: {
      request: {
        path: request.path,
        method: request.method,
      },
      renderSource: context.renderSource,
    },
  });
}
