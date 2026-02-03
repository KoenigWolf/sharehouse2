"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { TeaTimeNotification } from "@/components/tea-time-notification";
import { ResidentsGrid } from "@/components/residents-grid";
import { BulletinBoard } from "@/components/bulletin-board";
import { ShareContent } from "@/components/share-content";
import { EventsContent } from "@/components/events-content";
import { useI18n } from "@/hooks/use-i18n";
import type { Profile } from "@/domain/profile";
import type { BulletinWithProfile } from "@/domain/bulletin";
import type { ShareItemWithProfile } from "@/domain/share-item";
import type { EventWithDetails } from "@/domain/event";
import type { TeaTimeMatch } from "@/domain/tea-time";
import type { TranslationKey } from "@/lib/i18n";

type Tab = "residents" | "bulletin" | "share" | "events";

const TABS: { id: Tab; labelKey: TranslationKey }[] = [
  { id: "residents", labelKey: "nav.residents" },
  { id: "bulletin", labelKey: "bulletin.title" },
  { id: "share", labelKey: "nav.share" },
  { id: "events", labelKey: "nav.events" },
];

interface HomeContentProps {
  profiles: Profile[];
  currentUserId: string;
  mockCount: number;
  dbProfilesCount: number;
  bulletins: BulletinWithProfile[];
  shareItems: ShareItemWithProfile[];
  events: EventWithDetails[];
  latestMatch: (TeaTimeMatch & { partner: Profile | null }) | null;
}

export function HomeContent({
  profiles,
  currentUserId,
  mockCount,
  dbProfilesCount,
  bulletins,
  shareItems,
  events,
  latestMatch,
}: HomeContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("residents");
  const t = useI18n();

  return (
    <div>
      {latestMatch && (
        <div className="container mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
          <TeaTimeNotification match={latestMatch} />
        </div>
      )}

      <div className="border-b border-zinc-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-xs tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? "text-zinc-900 font-medium"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {t(tab.labelKey)}
                {activeTab === tab.id && (
                  <m.span
                    layoutId="home-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <AnimatePresence mode="wait">
          <m.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "residents" && (
              <>
                {mockCount > 0 && (
                  <p className="text-xs text-zinc-400 mb-5 sm:mb-6">
                    {t("residents.registeredLabel", { count: dbProfilesCount })} /{" "}
                    {t("residents.unregisteredLabel", { count: mockCount })}
                  </p>
                )}
                <ResidentsGrid profiles={profiles} currentUserId={currentUserId} />
              </>
            )}
            {activeTab === "bulletin" && (
              <BulletinBoard bulletins={bulletins} currentUserId={currentUserId} />
            )}
            {activeTab === "share" && (
              <ShareContent items={shareItems} currentUserId={currentUserId} />
            )}
            {activeTab === "events" && (
              <EventsContent events={events} currentUserId={currentUserId} />
            )}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
