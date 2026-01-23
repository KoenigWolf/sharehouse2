"use client";

import { useState, useMemo, useCallback } from "react";
import { ResidentCard } from "@/components/resident-card";
import { ResidentsFilter } from "@/components/residents-filter";
import { Profile } from "@/types/profile";

interface ResidentsGridProps {
  profiles: Profile[];
  currentUserId: string;
}

export function ResidentsGrid({ profiles, currentUserId }: ResidentsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "room_number" | "move_in_date">("room_number");

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSortChange = useCallback((sort: "name" | "room_number" | "move_in_date") => {
    setSortBy(sort);
  }, []);

  const filteredAndSortedProfiles = useMemo(() => {
    let result = [...profiles];

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

    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          // 名前順: 自分を先頭に
          if (a.id === currentUserId) return -1;
          if (b.id === currentUserId) return 1;
          return a.name.localeCompare(b.name, "ja");
        case "room_number":
          // 部屋番号順: 純粋に番号順
          const roomA = a.room_number || "999";
          const roomB = b.room_number || "999";
          return roomA.localeCompare(roomB, "ja", { numeric: true });
        case "move_in_date":
          // 入居日順: 自分を先頭に
          if (a.id === currentUserId) return -1;
          if (b.id === currentUserId) return 1;
          const dateA = a.move_in_date || "9999-12-31";
          const dateB = b.move_in_date || "9999-12-31";
          return dateA.localeCompare(dateB);
        default:
          return 0;
      }
    });

    return result;
  }, [profiles, searchQuery, sortBy, currentUserId]);

  if (profiles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#737373]">まだ住民が登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ヘッダーとフィルター */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg text-[#1a1a1a] tracking-wide">住民一覧</h2>
          <span className="text-xs text-[#a3a3a3]">{filteredAndSortedProfiles.length}人</span>
        </div>
        <ResidentsFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
      </div>

      {filteredAndSortedProfiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#737373]">条件に一致する住民がいません</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-sm text-[#b94a48] hover:underline mt-2"
          >
            検索をクリア
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {filteredAndSortedProfiles.map((profile) => (
            <ResidentCard
              key={profile.id}
              profile={profile}
              isCurrentUser={profile.id === currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
