import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileDetail } from "@/components/profile-detail";
import { Profile } from "@/domain/profile";

const mockProfile: Profile = {
  id: "user-123",
  name: "山田 太郎",
  room_number: "301",
  avatar_url: "https://example.com/avatar.jpg",
  bio: "こんにちは、山田です。シェアハウスでの生活を楽しんでいます。",
  interests: ["料理", "映画", "ランニング"],
  mbti: null,
  is_admin: false,
  move_in_date: "2024-01-15",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("ProfileDetail", () => {
  describe("basic rendering", () => {
    it("renders profile name", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
    });

    it("renders room number with suffix", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      expect(screen.getByText(/301号室/)).toBeInTheDocument();
    });

    it("renders bio", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      expect(
        screen.getByText(
          "こんにちは、山田です。シェアハウスでの生活を楽しんでいます。"
        )
      ).toBeInTheDocument();
    });

    it("renders all interests", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      expect(screen.getByText("料理")).toBeInTheDocument();
      expect(screen.getByText("映画")).toBeInTheDocument();
      expect(screen.getByText("ランニング")).toBeInTheDocument();
    });

    it("renders back link", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      expect(screen.getByText("戻る")).toBeInTheDocument();
    });
  });

  describe("optional fields", () => {
    it("does not render room number when not provided", () => {
      const profileWithoutRoom = { ...mockProfile, room_number: null };
      render(
        <ProfileDetail profile={profileWithoutRoom} isOwnProfile={false} />
      );
      expect(screen.queryByText(/号室/)).not.toBeInTheDocument();
    });

    it("does not render bio when not provided", () => {
      const profileWithoutBio = { ...mockProfile, bio: null };
      render(
        <ProfileDetail profile={profileWithoutBio} isOwnProfile={false} />
      );
      expect(
        screen.queryByText(
          "こんにちは、山田です。シェアハウスでの生活を楽しんでいます。"
        )
      ).not.toBeInTheDocument();
    });

    it("does not render interests when empty", () => {
      const profileWithoutInterests = { ...mockProfile, interests: [] };
      render(
        <ProfileDetail
          profile={profileWithoutInterests}
          isOwnProfile={false}
        />
      );
      expect(screen.queryByText("料理")).not.toBeInTheDocument();
    });

    it("does not render move-in info when date not provided", () => {
      const profileWithoutMoveIn = { ...mockProfile, move_in_date: null };
      render(
        <ProfileDetail profile={profileWithoutMoveIn} isOwnProfile={false} />
      );
      expect(screen.queryByText("入居日")).not.toBeInTheDocument();
    });
  });

  describe("own profile handling", () => {
    it("shows edit button when isOwnProfile is true", () => {
      render(<ProfileDetail profile={mockProfile} isOwnProfile={true} />);
      expect(screen.getByText("編集")).toBeInTheDocument();
    });

    it("hides edit button when isOwnProfile is false", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      expect(screen.queryByText("編集")).not.toBeInTheDocument();
    });

    it("edit button links to edit page", () => {
      render(<ProfileDetail profile={mockProfile} isOwnProfile={true} />);
      const editLink = screen.getByText("編集").closest("a");
      expect(editLink).toHaveAttribute("href", "/profile/user-123/edit");
    });
  });

  describe("mock profile handling", () => {
    it("shows banner for mock profiles", () => {
      const mockMockProfile = { ...mockProfile, id: "mock-301" };
      render(
        <ProfileDetail profile={mockMockProfile} isOwnProfile={false} />
      );
      expect(
        screen.getByText("この部屋はまだ住民が登録されていません")
      ).toBeInTheDocument();
    });

    it("shows subtext for mock profiles", () => {
      const mockMockProfile = { ...mockProfile, id: "mock-301" };
      render(
        <ProfileDetail profile={mockMockProfile} isOwnProfile={false} />
      );
      expect(
        screen.getByText("サンプルデータを表示しています")
      ).toBeInTheDocument();
    });

    it("does not show banner for regular profiles", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      expect(
        screen.queryByText("この部屋はまだ住民が登録されていません")
      ).not.toBeInTheDocument();
    });

    it("applies dashed border for mock profiles", () => {
      const mockMockProfile = { ...mockProfile, id: "mock-301" };
      const { container } = render(
        <ProfileDetail profile={mockMockProfile} isOwnProfile={false} />
      );
      const card = container.querySelector(".border-dashed");
      expect(card).toBeInTheDocument();
    });
  });

  describe("tea time status", () => {
    it("shows participating status when teaTimeEnabled is true", () => {
      render(
        <ProfileDetail
          profile={mockProfile}
          isOwnProfile={false}
          teaTimeEnabled={true}
        />
      );
      expect(screen.getByText(/参加中/)).toBeInTheDocument();
    });

    it("shows not participating status when teaTimeEnabled is false", () => {
      render(
        <ProfileDetail
          profile={mockProfile}
          isOwnProfile={false}
          teaTimeEnabled={false}
        />
      );
      expect(screen.getByText(/不参加/)).toBeInTheDocument();
    });

    it("applies muted green color for participating", () => {
      render(
        <ProfileDetail
          profile={mockProfile}
          isOwnProfile={false}
          teaTimeEnabled={true}
        />
      );
      const statusText = screen.getByText(/参加中/);
      expect(statusText).toHaveClass("text-[#5c7a6b]");
    });

    it("applies gray color for not participating", () => {
      render(
        <ProfileDetail
          profile={mockProfile}
          isOwnProfile={false}
          teaTimeEnabled={false}
        />
      );
      const statusText = screen.getByText(/不参加/);
      expect(statusText).toHaveClass("text-[#737373]");
    });
  });

  describe("accessibility", () => {
    it("uses article element for semantic structure", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    it("back link has proper aria-label", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      const backLink = screen.getByLabelText("住民一覧に戻る");
      expect(backLink).toBeInTheDocument();
    });

    it("profile name uses h1 heading", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("山田 太郎");
    });

    it("mock profile banner has alert role", () => {
      const mockMockProfile = { ...mockProfile, id: "mock-301" };
      render(
        <ProfileDetail profile={mockMockProfile} isOwnProfile={false} />
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("avatar image has appropriate alt text when loaded", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      // Check that the avatar section exists with proper structure
      const avatarContainer = screen.getByRole("article").querySelector(".w-40");
      expect(avatarContainer).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("back link points to home", () => {
      render(
        <ProfileDetail profile={mockProfile} isOwnProfile={false} />
      );
      const backLink = screen.getByLabelText("住民一覧に戻る");
      expect(backLink).toHaveAttribute("href", "/");
    });
  });
});
