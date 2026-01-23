"use client";

import { useState, useMemo } from "react";
import { ResidentCard } from "@/components/resident-card";
import { ResidentsFilter } from "@/components/residents-filter";
import { Profile } from "@/types/profile";

interface ResidentsGridProps {
  profiles: Profile[];
  currentUserId: string;
}

export function ResidentsGrid({ profiles, currentUserId }: ResidentsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "room_number" | "move_in_date">("name");
  const [interestFilter, setInterestFilter] = useState<string | null>(null);

  // 利用可能な趣味を抽出（出現頻度順）
  const availableInterests = useMemo(() => {
    const interestCount: Record<string, number> = {};
    profiles.forEach((profile) => {
      profile.interests?.forEach((interest) => {
        interestCount[interest] = (interestCount[interest] || 0) + 1;
      });
    });
    return Object.entries(interestCount)
      .filter(([, count]) => count >= 2) // 2人以上が持つ趣味のみ
      .sort((a, b) => b[1] - a[1])
      .map(([interest]) => interest);
  }, [profiles]);

  // フィルター・ソート処理
  const filteredAndSortedProfiles = useMemo(() => {
    let result = [...profiles];

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (profile) =>
          profile.name.toLowerCase().includes(query) ||
          profile.interests?.some((interest) =>
            interest.toLowerCase().includes(query)
          )
      );
    }

    // 趣味フィルター
    if (interestFilter) {
      result = result.filter((profile) =>
        profile.interests?.includes(interestFilter)
      );
    }

    // ソート
    result.sort((a, b) => {
      // 自分を常に先頭に
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;

      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "ja");
        case "room_number":
          const roomA = a.room_number || "999";
          const roomB = b.room_number || "999";
          return roomA.localeCompare(roomB, "ja", { numeric: true });
        case "move_in_date":
          const dateA = a.move_in_date || "9999-12-31";
          const dateB = b.move_in_date || "9999-12-31";
          return dateA.localeCompare(dateB);
        default:
          return 0;
      }
    });

    return result;
  }, [profiles, searchQuery, sortBy, interestFilter, currentUserId]);

  if (profiles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#737373]">まだ住民が登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ResidentsFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        interestFilter={interestFilter}
        onInterestFilterChange={setInterestFilter}
        availableInterests={availableInterests}
      />

      {filteredAndSortedProfiles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#737373]">条件に一致する住民がいません</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setInterestFilter(null);
            }}
            className="text-sm text-[#b94a48] hover:underline mt-2"
          >
            フィルターをクリア
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#a3a3a3]">
            {filteredAndSortedProfiles.length}人を表示
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAndSortedProfiles.map((profile, index) => (
              <ResidentCard
                key={profile.id}
                profile={profile}
                index={index}
                isCurrentUser={profile.id === currentUserId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
