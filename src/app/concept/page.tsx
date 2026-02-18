"use client";

import { useRef } from "react";
import { m, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import {
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Handshake,
  MessagesSquare,
  Package,
  CalendarDays,
  Images,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { useI18n } from "@/hooks/use-i18n";
import { PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  residents: Users,
  teaTime: Handshake,
  bulletin: MessagesSquare,
  share: Package,
  events: CalendarDays,
  gallery: Images,
};

export default function ConceptPage() {
  const t = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const keywords = [
    t("concept.hero.keywords.0"),
    t("concept.hero.keywords.1"),
    t("concept.hero.keywords.2"),
    t("concept.hero.keywords.3"),
  ];

  const keywordIndex = useTransform(smoothProgress, [0, 0.1, 0.2, 0.3], [0, 1, 2, 3]);

  return (
    <div className="min-h-[300vh] bg-white relative" ref={containerRef}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      <PageTransition>
        <main className="relative">
          {/* Hero Section - SEREAL style */}
          <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden bg-white">
            {/* Decorative circle - SEREAL style */}
            <m.div
              style={{
                scale: useTransform(scrollYProgress, [0, 0.3], [1, 1.5]),
                opacity: useTransform(scrollYProgress, [0, 0.2, 0.4], [0.03, 0.05, 0]),
              }}
              className="absolute w-[80vmin] h-[80vmin] rounded-full border border-foreground/10 pointer-events-none"
            />
            <m.div
              style={{
                scale: useTransform(scrollYProgress, [0, 0.3], [0.8, 1.3]),
                opacity: useTransform(scrollYProgress, [0, 0.2, 0.4], [0.02, 0.04, 0]),
              }}
              className="absolute w-[60vmin] h-[60vmin] rounded-full border border-foreground/5 pointer-events-none"
            />

            <div className="container mx-auto px-6 relative z-10">
              <div className="flex flex-col items-center justify-center text-center">
                <m.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xs sm:text-sm tracking-[0.3em] uppercase text-foreground/40 mb-8"
                >
                  Share House Portal
                </m.p>

                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] text-foreground">
                  <m.span
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="block"
                  >
                    {t("concept.hero.prefix")}
                  </m.span>
                  <span className="block h-[1.15em] overflow-hidden relative">
                    <KeywordCycler index={keywordIndex} keywords={keywords} />
                  </span>
                  <m.span
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="block"
                  >
                    {t("concept.hero.suffix")}
                  </m.span>
                </h1>
              </div>
            </div>

            {/* Scroll indicator - SEREAL style */}
            <m.div
              style={{ opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]) }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            >
              <m.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-px h-16 bg-foreground/20 relative overflow-hidden"
              >
                <m.div
                  animate={{ y: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute w-full h-1/3 bg-foreground/60"
                />
              </m.div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/30">
                Scroll
              </span>
            </m.div>
          </div>

          {/* Content Sections */}
          <div className="relative bg-white">
            {/* Mission Section - SEREAL style minimal */}
            <section className="py-32 md:py-48">
              <div className="container mx-auto px-6 max-w-4xl">
                <m.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="text-center"
                >
                  <p className="text-xs tracking-[0.3em] uppercase text-foreground/30 mb-8">
                    {t("concept.mission.title")}
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {t("concept.mission.content")}
                  </p>
                </m.div>
              </div>
            </section>

            {/* Vision Section - SEREAL grid style */}
            <section className="py-32 md:py-48 border-t border-foreground/5">
              <div className="container mx-auto px-6 max-w-6xl">
                <m.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-xs tracking-[0.3em] uppercase text-foreground/30 mb-16 text-center"
                >
                  {t("concept.vision.title")}
                </m.p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-foreground/5">
                  <VisionCard
                    icon={Users}
                    title={t("concept.vision.connection.title")}
                    desc={t("concept.vision.connection.description")}
                    index={0}
                  />
                  <VisionCard
                    icon={ShieldCheck}
                    title={t("concept.vision.safety.title")}
                    desc={t("concept.vision.safety.description")}
                    index={1}
                  />
                  <VisionCard
                    icon={Sparkles}
                    title={t("concept.vision.vibe.title")}
                    desc={t("concept.vision.vibe.description")}
                    index={2}
                  />
                </div>
              </div>
            </section>

            {/* Features Section - SEREAL minimal cards */}
            <section className="py-32 md:py-48 border-t border-foreground/5">
              <div className="container mx-auto px-6 max-w-6xl">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-20"
                >
                  <p className="text-xs tracking-[0.3em] uppercase text-foreground/30 mb-4">
                    {t("concept.features.title")}
                  </p>
                  <p className="text-xl md:text-2xl font-medium text-foreground/60">
                    {t("concept.features.subtitle")}
                  </p>
                </m.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(["residents", "teaTime", "bulletin", "share", "events", "gallery"] as const).map(
                    (key, i) => {
                      const Icon = FEATURE_ICONS[key];
                      return (
                        <m.div
                          key={key}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ delay: i * 0.1, duration: 0.6 }}
                          className="group"
                        >
                          <div className="p-8 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors duration-500">
                            <Icon
                              className="w-8 h-8 text-foreground/20 group-hover:text-foreground/40 transition-colors duration-500 mb-6"
                              strokeWidth={1.5}
                            />
                            <h3 className="text-lg font-semibold mb-3 text-foreground/80">
                              {t(`concept.features.${key}.title`)}
                            </h3>
                            <p className="text-sm text-foreground/40 leading-relaxed">
                              {t(`concept.features.${key}.description`)}
                            </p>
                          </div>
                        </m.div>
                      );
                    }
                  )}
                </div>
              </div>
            </section>

            {/* Principles Section - SEREAL numbered list */}
            <section className="py-32 md:py-48 border-t border-foreground/5 bg-foreground/[0.02]">
              <div className="container mx-auto px-6 max-w-4xl">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-20"
                >
                  <p className="text-xs tracking-[0.3em] uppercase text-foreground/30 mb-4">
                    {t("concept.principles.title")}
                  </p>
                  <p className="text-xl md:text-2xl font-medium text-foreground/60">
                    {t("concept.principles.subtitle")}
                  </p>
                </m.div>

                <div className="space-y-0">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                      className="flex gap-8 py-8 border-b border-foreground/5 group"
                    >
                      <span className="text-5xl font-extralight text-foreground/10 group-hover:text-foreground/20 transition-colors w-16 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="pt-2">
                        <h3 className="text-lg font-semibold mb-2 text-foreground/80">
                          {t(`concept.principles.items.${i}.title` as Parameters<typeof t>[0])}
                        </h3>
                        <p className="text-foreground/40 leading-relaxed">
                          {t(`concept.principles.items.${i}.description` as Parameters<typeof t>[0])}
                        </p>
                      </div>
                    </m.div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section - SEREAL style */}
            <section className="py-32 md:py-48 border-t border-foreground/5">
              <div className="container mx-auto px-6 max-w-4xl text-center">
                <m.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-12 text-foreground/90">
                    {t("concept.callToAction")}
                  </h2>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 px-12 rounded-none border-foreground/20 hover:bg-foreground hover:text-white transition-all duration-500 text-sm tracking-wider"
                  >
                    <Link href="/residents">
                      {t("auth.browseAsGuest")}
                      <ArrowRight className="ml-3 w-4 h-4" />
                    </Link>
                  </Button>
                </m.div>
              </div>
            </section>
          </div>
        </main>
      </PageTransition>

      <Footer variant="minimal" />
      <MobileNav />
    </div>
  );
}

function KeywordCycler({
  index,
  keywords,
}: {
  index: MotionValue<number>;
  keywords: string[];
}) {
  const y = useTransform(index, (latest: number) => {
    const i = Math.floor(Math.min(latest, keywords.length - 1));
    return `${i * -100}%`;
  });

  return (
    <m.div
      style={{ y }}
      className="absolute top-0 left-0 w-full transition-transform duration-700 ease-out"
    >
      {keywords.map((k, i) => (
        <div key={i} className="h-full flex items-center justify-center">
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {k}
          </span>
        </div>
      ))}
    </m.div>
  );
}

function VisionCard({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.15, duration: 0.6 }}
      className="bg-white p-10 md:p-12 group"
    >
      <div className="mb-8 text-foreground/15 group-hover:text-foreground/30 transition-colors duration-500">
        <Icon size={36} strokeWidth={1} />
      </div>
      <h3 className="text-xl font-semibold mb-4 tracking-tight text-foreground/80">{title}</h3>
      <p className="text-foreground/40 leading-relaxed">{desc}</p>
    </m.div>
  );
}
