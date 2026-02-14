import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getServerTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
    title: t("legal.termsTitle"),
    description: t("legal.termsMetaDescription"),
  };
}

export default async function TermsPage() {
  const t = await getServerTranslator();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pb-20 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("common.back")}
          </Link>

          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {t("legal.termsTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              {t("legal.lastUpdated", { date: "2025-02-14" })}
            </p>

            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.terms.article1Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.terms.article1Content")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.terms.article2Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.terms.article2Content")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.terms.article3Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed mb-3">
                  {t("legal.terms.article3Content")}
                </p>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                  <li>{t("legal.terms.article3Item1")}</li>
                  <li>{t("legal.terms.article3Item2")}</li>
                  <li>{t("legal.terms.article3Item3")}</li>
                  <li>{t("legal.terms.article3Item4")}</li>
                  <li>{t("legal.terms.article3Item5")}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.terms.article4Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.terms.article4Content")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.terms.article5Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.terms.article5Content")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.terms.article6Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.terms.article6Content")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("legal.terms.article7Title")}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {t("legal.terms.article7Content")}
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
