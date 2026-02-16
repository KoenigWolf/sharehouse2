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

    it("renders room number when provided", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByText("301")).toBeInTheDocument();
    });

    it("does not render room number when not provided", () => {
      const profileWithoutRoom = { ...mockProfile, room_number: null };
      render(<ResidentCard profile={profileWithoutRoom} />);
      expect(screen.queryByText("301")).not.toBeInTheDocument();
    });

    it("renders interests (limited to 3)", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.getByText("料理")).toBeInTheDocument();
      expect(screen.getByText("映画")).toBeInTheDocument();
      // Third interest should not be rendered (card limit is 2)
      expect(screen.queryByText("ランニング")).not.toBeInTheDocument();
      expect(screen.queryByText("読書")).not.toBeInTheDocument();
    });

    it("shows remaining count when more than 3 interests", () => {
      render(<ResidentCard profile={mockProfile} />);
      // Shows +2 for the 3rd and 4th interests
      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("handles empty interests", () => {
      const profileWithoutInterests = { ...mockProfile, interests: [] };
      render(<ResidentCard profile={profileWithoutInterests} />);
      expect(screen.queryByText("料理")).not.toBeInTheDocument();
    });

    it("handles undefined interests via optional chaining in component", () => {
      const profileWithEmptyInterests = { ...mockProfile, interests: [] };
      render(<ResidentCard profile={profileWithEmptyInterests} />);
      expect(screen.queryByText("料理")).not.toBeInTheDocument();
    });
  });

  describe("current user badge", () => {
    it("shows 'You' badge when isCurrentUser is true", () => {
      render(<ResidentCard profile={mockProfile} isCurrentUser={true} />);
      expect(screen.getByText("You")).toBeInTheDocument();
    });

    it("does not show badge when isCurrentUser is false", () => {
      render(<ResidentCard profile={mockProfile} isCurrentUser={false} />);
      expect(screen.queryByText("You")).not.toBeInTheDocument();
    });

    it("does not show badge by default", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.queryByText("You")).not.toBeInTheDocument();
    });
  });

  describe("mock profile handling", () => {
    it("shows '未登録' badge for mock profiles", () => {
      render(<ResidentCard profile={mockMockProfile} />);
      expect(screen.queryByText("未登録")).toBeNull();
    });

    it("does not show '未登録' badge for regular profiles", () => {
      render(<ResidentCard profile={mockProfile} />);
      expect(screen.queryByText("未登録")).toBeNull();
    });

    it("applies border for mock profiles", () => {
      const { container } = render(<ResidentCard profile={mockMockProfile} />);
      const article = container.querySelector("article");
      expect(article).toHaveClass("border-border/60");
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

    it("avatar fallback shows initials", () => {
      const profileNoAvatar = { ...mockProfile, avatar_url: null };
      render(<ResidentCard profile={profileNoAvatar} />);
      expect(screen.getByText("山太")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("applies ring styling for current user", () => {
      const { container } = render(
        <ResidentCard profile={mockProfile} isCurrentUser={true} />
      );
      const article = container.querySelector("article");
      expect(article).toHaveClass("ring-2");
      expect(article).toHaveClass("ring-brand-500/20");
    });

    it("applies normal border for regular profile", () => {
      const { container } = render(<ResidentCard profile={mockProfile} />);
      const article = container.querySelector("article");
      expect(article).toHaveClass("border-border/60");
    });
  });
});
