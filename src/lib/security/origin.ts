const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000"];

export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (publicSiteUrl) {
    origins.add(publicSiteUrl);
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    origins.add(`https://${vercelUrl}`);
  }

  DEFAULT_ALLOWED_ORIGINS.forEach((origin) => origins.add(origin));

  return Array.from(origins);
}
