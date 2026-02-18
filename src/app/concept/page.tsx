"use client";

import { useRef } from "react";
import { m, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import {
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Coffee,
  MessageCircle,
  Gift,
  Calendar,
  Image,
  AlertCircle,
  CheckCircle2,
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
  teaTime: Coffee,
  bulletin: MessageCircle,
  share: Gift,
  events: Calendar,
  gallery: Image,
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

  const keywordIndex = useTransform(smoothProgress, [0, 0.15, 0.3, 0.45], [0, 1, 2, 3]);
  const circleScale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1.2]);
  const circleOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.1, 0.2, 0.2, 0]);

  return (
    <div className="min-h-[400vh] bg-background flex flex-col relative" ref={containerRef}>
      <div className="sereal-glow fixed inset-0 z-0" />
      <Header />

      <PageTransition>
        <main className="flex-1 relative z-10">
          {/* Hero Section */}
          <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
            <m.div
              style={{ scale: circleScale, opacity: circleOpacity }}
              className="absolute w-[80vh] h-[80vh] rounded-full bg-foreground/5 pointer-events-none blur-3xl"
            />

            <div className="container mx-auto px-6 relative z-10">
              <div className="flex flex-col items-start justify-center min-h-[50vh]">
                <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-foreground uppercase">
                  <div>{t("concept.hero.prefix")}</div>
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600 h-[1.1em] overflow-hidden relative">
                    <KeywordCycler index={keywordIndex} keywords={keywords} />
                  </div>
                  <div>{t("concept.hero.suffix")}</div>
                </h1>
              </div>
            </div>

            <m.div
              style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                Scroll
              </span>
              <div className="w-px h-12 bg-muted-foreground/30 overflow-hidden relative">
                <m.div
                  initial={{ y: "-100%" }}
                  animate={{ y: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute w-full h-1/2 bg-foreground"
                />
              </div>
            </m.div>
          </div>

          {/* Content Sections */}
          <div className="relative bg-background/80 backdrop-blur-xl border-t border-border/20">
            {/* Mission Section */}
            <section className="py-32 border-b border-border/20">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div>
                    <h2 className="text-base font-bold tracking-widest uppercase text-muted-foreground mb-4">
                      {t("concept.mission.title")}
                    </h2>
                    <p className="text-3xl md:text-4xl font-bold leading-tight whitespace-pre-wrap">
                      {t("concept.mission.content")}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-full aspect-square rounded-full border border-border/50 relative flex items-center justify-center group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Sparkles
                        size={64}
                        className="text-foreground/20 group-hover:text-brand-500 transition-colors duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Problem Section */}
            <section className="py-32 border-b border-border/20 bg-muted/30">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="mb-16">
                  <h2 className="text-base font-bold tracking-widest uppercase text-muted-foreground mb-4">
                    {t("concept.problem.title")}
                  </h2>
                  <p className="text-2xl md:text-3xl font-bold text-foreground/80">
                    {t("concept.problem.subtitle")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                  {[0, 1, 2, 3].map((i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="flex items-start gap-4 p-6 bg-background rounded-xl border border-border/50"
                    >
                      <AlertCircle className="w-6 h-6 text-error shrink-0 mt-0.5" />
                      <p className="text-foreground/80">{t(`concept.problem.items.${i}` as Parameters<typeof t>[0])}</p>
                    </m.div>
                  ))}
                </div>

                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <p className="text-xl md:text-2xl font-bold text-foreground whitespace-pre-wrap">
                    {t("concept.problem.conclusion")}
                  </p>
                </m.div>
              </div>
            </section>

            {/* Vision Section */}
            <section className="py-32 border-b border-border/20">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex items-end justify-between mb-16 border-b border-border/50 pb-8">
                  <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground/10 uppercase">
                    {t("concept.vision.title")}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <VisionCard
                    icon={Users}
                    title={t("concept.vision.connection.title")}
                    desc={t("concept.vision.connection.description")}
                    delay={0}
                  />
                  <VisionCard
                    icon={ShieldCheck}
                    title={t("concept.vision.safety.title")}
                    desc={t("concept.vision.safety.description")}
                    delay={0.1}
                  />
                  <VisionCard
                    icon={Sparkles}
                    title={t("concept.vision.vibe.title")}
                    desc={t("concept.vision.vibe.description")}
                    delay={0.2}
                  />
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-32 border-b border-border/20 bg-muted/30">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="mb-16">
                  <h2 className="text-base font-bold tracking-widest uppercase text-muted-foreground mb-4">
                    {t("concept.features.title")}
                  </h2>
                  <p className="text-2xl md:text-3xl font-bold text-foreground/80">
                    {t("concept.features.subtitle")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(["residents", "teaTime", "bulletin", "share", "events", "gallery"] as const).map(
                    (key, i) => {
                      const Icon = FEATURE_ICONS[key];
                      return (
                        <m.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ delay: i * 0.05, duration: 0.4 }}
                          className="p-6 bg-background rounded-xl border border-border/50 hover:border-brand-500/50 transition-colors group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-brand-500/10 transition-colors">
                            <Icon className="w-6 h-6 text-muted-foreground group-hover:text-brand-500 transition-colors" />
                          </div>
                          <h3 className="text-lg font-bold mb-2">
                            {t(`concept.features.${key}.title`)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t(`concept.features.${key}.description`)}
                          </p>
                        </m.div>
                      );
                    }
                  )}
                </div>
              </div>
            </section>

            {/* Principles Section */}
            <section className="py-32 border-b border-border/20">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="mb-16">
                  <h2 className="text-base font-bold tracking-widest uppercase text-muted-foreground mb-4">
                    {t("concept.principles.title")}
                  </h2>
                  <p className="text-2xl md:text-3xl font-bold text-foreground/80">
                    {t("concept.principles.subtitle")}
                  </p>
                </div>

                <div className="space-y-6">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="flex gap-6 p-6 border-l-4 border-brand-500/50 bg-muted/30 rounded-r-xl"
                    >
                      <span className="text-4xl font-black text-brand-500/30">{i + 1}</span>
                      <div>
                        <h3 className="text-lg font-bold mb-1">
                          {t(`concept.principles.items.${i}.title` as Parameters<typeof t>[0])}
                        </h3>
                        <p className="text-muted-foreground">
                          {t(`concept.principles.items.${i}.description` as Parameters<typeof t>[0])}
                        </p>
                      </div>
                    </m.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Success Section */}
            <section className="py-32 border-b border-border/20 bg-muted/30">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="mb-16">
                  <h2 className="text-base font-bold tracking-widest uppercase text-muted-foreground mb-4">
                    {t("concept.success.title")}
                  </h2>
                  <p className="text-2xl md:text-3xl font-bold text-foreground/80">
                    {t("concept.success.subtitle")}
                  </p>
                </div>

                <div className="space-y-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border/50"
                    >
                      <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                      <p className="text-foreground/80">{t(`concept.success.items.${i}` as Parameters<typeof t>[0])}</p>
                    </m.div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-32">
              <div className="container mx-auto px-6 max-w-6xl text-center">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-12 uppercase">
                  {t("concept.callToAction")}
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Button asChild size="lg" className="h-14 px-10 rounded-full text-lg font-bold">
                    <Link href="/residents">
                      {t("auth.browseAsGuest")} <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </div>
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
      className="absolute top-0 left-0 w-full transition-transform duration-500 ease-out"
    >
      {keywords.map((k, i) => (
        <div key={i} className="h-full flex items-center">
          {k.toUpperCase()}
        </div>
      ))}
    </m.div>
  );
}

function VisionCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay, duration: 0.5 }}
      className="p-8 border-t border-foreground/10 hover:border-foreground/50 transition-colors duration-300 group"
    >
      <div className="mb-6 text-foreground/40 group-hover:text-brand-500 transition-colors duration-300">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold mb-4 tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </m.div>
  );
}
