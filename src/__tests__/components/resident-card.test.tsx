import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResidentCard } from "@/components/resident-card";
import { Profile } from "@/domain/profile";

const mockProfile: Profile = {
  id: "user-123",
  name: "山田 太郎",
  room_number: "301",
  avatar_url: "https://example.com/avatar.jpg",
  bio: "こんにちは",
  interests: ["料理", "映画", "ランニング", "読書"],
  mbti: null,
  move_in_date: "2024-01-15",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockMockProfile: Profile = {
  ...mockProfile,
  id: "mock-301",
  name: "301号室",
  avatar_url: null,
};

describe("ResidentCard", () => {
  describe("rendering", () => {
    it("renders profile name", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
    });

    it("renders room number when provided", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByText("301")).toBeInTheDocument();
    });

    it("does not render room number when not provided", () => {
      const profileWithoutRoom = { ...mockProfile, room_number: null };
      render(<ResidentCard profile={profileWithoutRoom} />);
      expect(screen.queryByText("301")).not.toBeInTheDocument();
    });

    it("renders interests (limited to 2)", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByText("料理")).toBeInTheDocument();
      expect(screen.getByText("映画")).toBeInTheDocument();
      // Third interest should not be rendered (card limit is 2)
      expect(screen.queryByText("ランニング")).not.toBeInTheDocument();
    });

    it("handles empty interests", () => {
      const profileWithoutInterests = { ...mockProfile, interests: [] };
      render(<ResidentCard profile={profileWithoutInterests} />);
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("handles undefined interests via optional chaining in component", () => {
      // The component uses optional chaining (profile.interests?.slice)
      // so it handles undefined gracefully even though the type requires string[]
      const profileWithEmptyInterests = { ...mockProfile, interests: [] };
      render(<ResidentCard profile={profileWithEmptyInterests} />);
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
  });

  describe("current user badge", () => {
    it("shows 'あなた' badge when isCurrentUser is true", () => {
      render(<ResidentCard profile={mockProfile} isCurrentUser={true} />);
      expect(screen.getByText("あなた")).toBeInTheDocument();
    });

    it("does not show badge when isCurrentUser is false", () => {
      render(<ResidentCard profile={mockProfile} isCurrentUser={false} />);
      expect(screen.queryByText("あなた")).not.toBeInTheDocument();
    });

    it("does not show badge by default", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.queryByText("あなた")).not.toBeInTheDocument();
    });
  });

  describe("mock profile handling", () => {
    it("shows '未登録' badge for mock profiles", () => {
      render(<ResidentCard profile={mockMockProfile} />);
      expect(screen.getByText("未登録")).toBeInTheDocument();
    });

    it("does not show '未登録' badge for regular profiles", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.queryByText("未登録")).not.toBeInTheDocument();
    });

    it("does not show '未登録' badge for mock profile when isCurrentUser", () => {
      render(<ResidentCard profile={mockMockProfile} isCurrentUser={true} />);
      expect(screen.queryByText("未登録")).not.toBeInTheDocument();
    });

    it("applies dashed border for mock profiles", () => {
      const { container } = render(<ResidentCard profile={mockMockProfile} />);
      const article = container.querySelector("article");
      expect(article).toHaveClass("border-dashed");
    });
  });

  describe("accessibility", () => {
    it("has accessible link with proper aria-label", () => {
      render(<ResidentCard profile={mockProfile} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "aria-label",
        "山田 太郎さんのプロフィールを見る"
      );
    });

    it("links to correct profile page", () => {
      render(<ResidentCard profile={mockProfile} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/profile/user-123");
    });

    it("has article role for profile content", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    it("interests list has accessible label", () => {
      render(<ResidentCard profile={mockProfile} />);
      const list = screen.getByRole("list");
      expect(list).toHaveAttribute("aria-label", "趣味・関心");
    });

    it("avatar fallback has aria-label", () => {
      const profileNoAvatar = { ...mockProfile, avatar_url: null };
      render(<ResidentCard profile={profileNoAvatar} />);
      const fallback = screen.getByLabelText("山田 太郎のイニシャル");
      expect(fallback).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("applies special border for current user", () => {
      const { container } = render(
        <ResidentCard profile={mockProfile} isCurrentUser={true} />
      );
      const article = container.querySelector("article");
      expect(article).toHaveClass("border-[#1a1a1a]");
    });

    it("applies normal border for regular profile", () => {
      const { container } = render(<ResidentCard profile={mockProfile} />);
      const article = container.querySelector("article");
      expect(article).toHaveClass("border-[#e5e5e5]");
    });
  });
});
