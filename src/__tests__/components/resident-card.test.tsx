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
  mbti: "INFJ",
  is_admin: false,
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

    it("renders room number badge", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByText("301")).toBeInTheDocument();
    });

    it("does not render room badge when not provided", () => {
      const profileWithoutRoom = { ...mockProfile, room_number: null };
      render(<ResidentCard profile={profileWithoutRoom} />);
      expect(screen.queryByText("301")).not.toBeInTheDocument();
    });

    it("renders MBTI", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByText("INFJ")).toBeInTheDocument();
    });

    it("renders interests (limited to 2)", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByText("料理")).toBeInTheDocument();
      expect(screen.getByText("映画")).toBeInTheDocument();
      expect(screen.queryByText("ランニング")).not.toBeInTheDocument();
      expect(screen.queryByText("読書")).not.toBeInTheDocument();
    });

    it("shows remaining count when more than 2 interests", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("handles empty interests", () => {
      const profileWithoutInterests = { ...mockProfile, interests: [] };
      render(<ResidentCard profile={profileWithoutInterests} />);
      expect(screen.queryByText("料理")).not.toBeInTheDocument();
    });
  });

  describe("current user badge", () => {
    it("shows 'YOU' badge when isCurrentUser is true", () => {
      render(<ResidentCard profile={mockProfile} isCurrentUser={true} />);
      expect(screen.getByText("YOU")).toBeInTheDocument();
    });

    it("does not show badge when isCurrentUser is false", () => {
      render(<ResidentCard profile={mockProfile} isCurrentUser={false} />);
      expect(screen.queryByText("YOU")).not.toBeInTheDocument();
    });

    it("does not show badge by default", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.queryByText("YOU")).not.toBeInTheDocument();
    });
  });

  describe("mock profile handling", () => {
    it("shows '未登録' overlay for mock profiles", () => {
      render(<ResidentCard profile={mockMockProfile} />);
      expect(screen.getByText("未登録")).toBeInTheDocument();
    });

    it("does not show '未登録' for regular profiles", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.queryByText("未登録")).not.toBeInTheDocument();
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
  });

  describe("styling", () => {
    it("applies ring styling for current user", () => {
      const { container } = render(
        <ResidentCard profile={mockProfile} isCurrentUser={true} />
      );
      const article = container.querySelector("article");
      expect(article).toHaveClass("ring-2");
      expect(article).toHaveClass("ring-brand-500");
    });

    it("uses 3:4 aspect ratio for photo card", () => {
      const { container } = render(<ResidentCard profile={mockProfile} />);
      const article = container.querySelector("article");
      // Checked against user code: 'aspect-[3/4]'
      expect(article).toHaveClass("aspect-[3/4]");
    });
  });
});
