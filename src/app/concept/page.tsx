"use client";

import { useRef, useState, useEffect } from "react";
import {
  m,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  type MotionValue,
} from "framer-motion";
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
  Home,
  KeyRound,
  UserCircle,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { useI18n } from "@/hooks/use-i18n";
import { PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  residents: Users,
  teaTime: Handshake,
  bulletin: MessagesSquare,
  share: Package,
  events: CalendarDays,
  gallery: Images,
};

const ONBOARDING_ICONS: LucideIcon[] = [Home, KeyRound, UserCircle, MessageCircle];

const SECTIONS = [
  "hero",
  "mission",
  "vision",
  "stats",
  "features",
  "testimonials",
  "principles",
  "faq",
  "onboarding",
  "cta",
] as const;

const CONCEPT_STATS = {
  residents: 18,
  capacity: 20,
} as const;

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

  const outerCircleScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.5]);
  const outerCircleOpacity = useTransform(scrollYProgress, [0, 0.2, 0.4], [0.03, 0.05, 0]);
  const innerCircleScale = useTransform(scrollYProgress, [0, 0.3], [0.8, 1.3]);
  const innerCircleOpacity = useTransform(scrollYProgress, [0, 0.2, 0.4], [0.02, 0.04, 0]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  return (
    <div className="min-h-[300vh] bg-background relative" ref={containerRef}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
        <m.div
          className="h-[2px] bg-foreground/20 origin-left"
          style={{ scaleX: scrollYProgress }}
        />
      </div>

      <PageTransition>
        <main className="relative">
          <div id="hero" className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
            <m.div
              style={{
                scale: outerCircleScale,
                opacity: outerCircleOpacity,
              }}
              className="absolute w-[80vmin] h-[80vmin] rounded-full border border-foreground/10 pointer-events-none"
            />
            <m.div
              style={{
                scale: innerCircleScale,
                opacity: innerCircleOpacity,
              }}
              className="absolute w-[60vmin] h-[60vmin] rounded-full border border-foreground/5 pointer-events-none"
            />

            <div className="container mx-auto px-6 relative z-10">
              <div className="flex flex-col items-center justify-center text-center">
                <m.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-xs sm:text-sm tracking-[0.3em] uppercase text-foreground/40 mb-8"
                >
                  {t("concept.hero.eyebrow")}
                </m.p>

                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] text-foreground">
                  <m.span
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                    transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="block"
                  >
                    {t("concept.hero.suffix")}
                  </m.span>
                </h1>
              </div>
            </div>

            <m.div
              style={{ opacity: scrollHintOpacity }}
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
                {t("concept.hero.scrollHint")}
              </span>
            </m.div>
          </div>

          <div className="relative bg-background">
            <section id="mission" className="py-32 md:py-48">
              <div className="container mx-auto px-6 max-w-4xl">
                <m.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
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

            <section id="vision" className="py-32 md:py-48 border-t border-foreground/5">
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

            <section id="stats" className="py-24 md:py-32 border-t border-foreground/5 bg-foreground/[0.02]">
              <div className="container mx-auto px-6 max-w-4xl">
                <m.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-xs tracking-[0.3em] uppercase text-foreground/30 mb-12 text-center"
                >
                  {t("concept.stats.title")}
                </m.p>

                <div className="grid grid-cols-2 gap-8 md:gap-16">
                  <AnimatedCounter
                    value={CONCEPT_STATS.residents}
                    label={t("concept.stats.residents")}
                    unit={t("concept.stats.unit")}
                  />
                  <AnimatedCounter
                    value={CONCEPT_STATS.capacity}
                    label={t("concept.stats.capacity")}
                    unit={t("concept.stats.unit")}
                  />
                </div>
              </div>
            </section>

            <section id="features" className="py-32 md:py-48 border-t border-foreground/5">
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
                          transition={{ delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
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

            <section id="testimonials" className="py-32 md:py-48 border-t border-foreground/5">
              <div className="container mx-auto px-6 max-w-4xl">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-20"
                >
                  <p className="text-xs tracking-[0.3em] uppercase text-foreground/30 mb-4">
                    {t("concept.testimonials.title")}
                  </p>
                  <p className="text-xl md:text-2xl font-medium text-foreground/60">
                    {t("concept.testimonials.subtitle")}
                  </p>
                </m.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[0, 1, 2].map((i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="p-8 bg-background border border-foreground/5"
                    >
                      <blockquote className="text-foreground/70 leading-relaxed mb-6">
                        &ldquo;{t(`concept.testimonials.items.${i}.quote` as Parameters<typeof t>[0])}&rdquo;
                      </blockquote>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 text-sm font-medium">
                          {(t(`concept.testimonials.items.${i}.name` as Parameters<typeof t>[0]) as string).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground/80">
                            {t(`concept.testimonials.items.${i}.name` as Parameters<typeof t>[0])}
                          </p>
                          <p className="text-xs text-foreground/40">
                            {t(`concept.testimonials.items.${i}.duration` as Parameters<typeof t>[0])}
                          </p>
                        </div>
                      </div>
                    </m.div>
                  ))}
                </div>
              </div>
            </section>

            <section id="principles" className="py-32 md:py-48 border-t border-foreground/5">
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
                      transition={{ delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
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

            <section id="faq" className="py-32 md:py-48 border-t border-foreground/5 bg-foreground/[0.02]">
              <div className="container mx-auto px-6 max-w-4xl">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <p className="text-xs tracking-[0.3em] uppercase text-foreground/30 mb-4">
                    {t("concept.faq.title")}
                  </p>
                  <p className="text-xl md:text-2xl font-medium text-foreground/60">
                    {t("concept.faq.subtitle")}
                  </p>
                </m.div>

                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <Accordion type="single" collapsible className="w-full">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <AccordionItem
                        key={i}
                        value={`item-${i}`}
                        className="border-b border-foreground/5"
                      >
                        <AccordionTrigger className="py-6 text-left text-foreground/80 hover:text-foreground hover:no-underline transition-colors">
                          {t(`concept.faq.items.${i}.question` as Parameters<typeof t>[0])}
                        </AccordionTrigger>
                        <AccordionContent className="text-foreground/50 leading-relaxed pb-6">
                          {t(`concept.faq.items.${i}.answer` as Parameters<typeof t>[0])}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </m.div>
              </div>
            </section>

            <section id="onboarding" className="py-32 md:py-48 border-t border-foreground/5">
              <div className="container mx-auto px-6 max-w-4xl">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-20"
                >
                  <p className="text-xs tracking-[0.3em] uppercase text-foreground/30 mb-4">
                    {t("concept.onboarding.title")}
                  </p>
                  <p className="text-xl md:text-2xl font-medium text-foreground/60">
                    {t("concept.onboarding.subtitle")}
                  </p>
                </m.div>

                <div className="relative">
                  <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-foreground/10 md:-translate-x-px" />

                  <div className="space-y-12 md:space-y-0">
                    {[0, 1, 2, 3].map((i) => {
                      const Icon = ONBOARDING_ICONS[i];
                      const isEven = i % 2 === 0;
                      return (
                        <m.div
                          key={i}
                          initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{
                            delay: i * 0.05,
                            duration: 0.4,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                          className={`relative flex items-start gap-6 md:gap-0 ${isEven ? "md:flex-row" : "md:flex-row-reverse"
                            }`}
                        >
                          <div
                            className={`hidden md:block w-1/2 ${isEven ? "pr-12 text-right" : "pl-12 text-left"
                              }`}
                          >
                            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
                              {t(
                                `concept.onboarding.steps.${i}.title` as Parameters<typeof t>[0]
                              )}
                            </h3>
                            <p className="text-foreground/40 leading-relaxed">
                              {t(
                                `concept.onboarding.steps.${i}.description` as Parameters<
                                  typeof t
                                >[0]
                              )}
                            </p>
                          </div>

                          <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-background border border-foreground/10 flex items-center justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
                            <Icon className="w-5 h-5 text-foreground/40" strokeWidth={1.5} />
                          </div>

                          <div className="md:hidden flex-1">
                            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
                              {t(
                                `concept.onboarding.steps.${i}.title` as Parameters<typeof t>[0]
                              )}
                            </h3>
                            <p className="text-foreground/40 leading-relaxed">
                              {t(
                                `concept.onboarding.steps.${i}.description` as Parameters<
                                  typeof t
                                >[0]
                              )}
                            </p>
                          </div>

                          <div className="hidden md:block w-1/2" />
                        </m.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section id="cta" className="py-32 md:py-48 border-t border-foreground/5">
              <div className="container mx-auto px-6 max-w-4xl text-center">
                <m.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                      {t("concept.cta.explore")}
                      <ArrowRight className="ml-3 w-4 h-4" />
                    </Link>
                  </Button>
                </m.div>
              </div>
            </section>
          </div>
        </main>
      </PageTransition>

      <SectionNav sections={SECTIONS} />

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
  const rawY = useTransform(index, (latest: number) => {
    const i = Math.floor(Math.min(latest, keywords.length - 1));
    return i * -100;
  });
  const y = useSpring(rawY, { stiffness: 100, damping: 30 });

  return (
    <m.div
      style={{ y: useTransform(y, (v) => `${v}%`) }}
      className="absolute top-0 left-0 w-full"
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
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-background p-10 md:p-12 group"
    >
      <div className="mb-8 text-foreground/15 group-hover:text-foreground/30 transition-colors duration-500">
        <Icon size={36} strokeWidth={1} />
      </div>
      <h3 className="text-xl font-semibold mb-4 tracking-tight text-foreground/80">{title}</h3>
      <p className="text-foreground/40 leading-relaxed">{desc}</p>
    </m.div>
  );
}

function SectionNav({ sections }: { sections: readonly string[] }) {
  const [activeSection, setActiveSection] = useState<string>("hero");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(sectionId);
            }
          });
        },
        { threshold: 0.3, rootMargin: "-20% 0px -60% 0px" }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sections]);

  const handleClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
      {sections.map((sectionId) => (
        <button
          key={sectionId}
          onClick={() => handleClick(sectionId)}
          className="group flex items-center justify-end gap-3"
          aria-label={`Navigate to ${sectionId} section`}
        >
          <span
            className={`text-[10px] uppercase tracking-wider transition-opacity duration-300 ${activeSection === sectionId
              ? "opacity-60"
              : "opacity-0 group-hover:opacity-40"
              }`}
          >
            {sectionId}
          </span>
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${activeSection === sectionId
              ? "bg-foreground/60 scale-125"
              : "bg-foreground/20 group-hover:bg-foreground/40"
              }`}
          />
        </button>
      ))}
    </div>
  );
}

function AnimatedCounter({
  value,
  label,
  unit,
}: {
  value: number;
  label: string;
  unit: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let rafId: number;
    let isCancelled = false;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      if (isCancelled) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * value));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <span className="text-5xl md:text-7xl font-extralight text-foreground/80 tabular-nums">
          {displayValue}
        </span>
        {unit && (
          <span className="text-2xl md:text-3xl font-extralight text-foreground/40 ml-1">
            {unit}
          </span>
        )}
      </m.div>
      <p className="text-sm text-foreground/40 mt-4 tracking-wider">{label}</p>
    </div>
  );
}
