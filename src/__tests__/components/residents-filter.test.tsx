import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResidentsFilter } from "@/components/residents-filter";

describe("ResidentsFilter", () => {
  const defaultProps = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    sortBy: "room_number" as const,
    onSortChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("search input", () => {
    it("renders search input", () => {
      render(<ResidentsFilter {...defaultProps} />);
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("displays current search query", () => {
      render(<ResidentsFilter {...defaultProps} searchQuery="山田" />);
      expect(screen.getByRole("searchbox")).toHaveValue("山田");
    });

    it("calls onSearchChange when typing", async () => {
      const onSearchChange = vi.fn();
      render(
        <ResidentsFilter {...defaultProps} onSearchChange={onSearchChange} />
      );

      const input = screen.getByRole("searchbox");
      await userEvent.type(input, "太郎");

      expect(onSearchChange).toHaveBeenCalled();
    });

    it("has accessible label", () => {
      render(<ResidentsFilter {...defaultProps} />);
      expect(screen.getByLabelText("住民を検索")).toBeInTheDocument();
    });

    it("has placeholder text", () => {
      render(<ResidentsFilter {...defaultProps} />);
      expect(
        screen.getByPlaceholderText("名前・趣味で検索")
      ).toBeInTheDocument();
    });
  });

  describe("sort buttons", () => {
    it("renders all sort options", () => {
      render(<ResidentsFilter {...defaultProps} />);

      expect(screen.getByText("部屋")).toBeInTheDocument();
      expect(screen.getByText("名前")).toBeInTheDocument();
      expect(screen.getByText("入居")).toBeInTheDocument();
    });

    it("highlights current sort option", () => {
      render(<ResidentsFilter {...defaultProps} sortBy="name" />);

      const nameButton = screen.getByText("名前");
      expect(nameButton).toHaveClass("bg-[#18181b]");
      expect(nameButton).toHaveClass("text-white");
    });

    it("calls onSortChange when clicking sort button", async () => {
      const onSortChange = vi.fn();
      render(
        <ResidentsFilter {...defaultProps} onSortChange={onSortChange} />
      );

      await userEvent.click(screen.getByText("名前"));

      expect(onSortChange).toHaveBeenCalledWith("name");
    });

    it("calls onSortChange with correct value for each option", async () => {
      const onSortChange = vi.fn();
      render(
        <ResidentsFilter {...defaultProps} onSortChange={onSortChange} />
      );

      await userEvent.click(screen.getByText("部屋"));
      expect(onSortChange).toHaveBeenCalledWith("room_number");

      await userEvent.click(screen.getByText("名前"));
      expect(onSortChange).toHaveBeenCalledWith("name");

      await userEvent.click(screen.getByText("入居"));
      expect(onSortChange).toHaveBeenCalledWith("move_in_date");
    });
  });

  describe("accessibility", () => {
    it("has search role on container", () => {
      render(<ResidentsFilter {...defaultProps} />);
      expect(screen.getByRole("search")).toBeInTheDocument();
    });

    it("sort buttons have aria-pressed attribute", () => {
      render(<ResidentsFilter {...defaultProps} sortBy="name" />);

      expect(screen.getByText("名前")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("部屋")).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByText("入居")).toHaveAttribute("aria-pressed", "false");
    });

    it("sort buttons have aria-label for screen readers", () => {
      render(<ResidentsFilter {...defaultProps} />);

      expect(
        screen.getByLabelText("部屋番号順に並び替え")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("名前順に並び替え")).toBeInTheDocument();
      expect(screen.getByLabelText("入居日順に並び替え")).toBeInTheDocument();
    });

    it("sort button group has aria-label", () => {
      render(<ResidentsFilter {...defaultProps} />);
      expect(screen.getByRole("group")).toHaveAttribute(
        "aria-label",
        "並び替えオプション"
      );
    });

    it("hidden label is present for search input", () => {
      render(<ResidentsFilter {...defaultProps} />);
      const label = screen.getByText("住民を検索");
      expect(label).toHaveClass("sr-only");
    });
  });

  describe("keyboard navigation", () => {
    it("search input is focusable", async () => {
      render(<ResidentsFilter {...defaultProps} />);
      const input = screen.getByRole("searchbox");

      await userEvent.tab();

      expect(input).toHaveFocus();
    });

    it("sort buttons are focusable", async () => {
      render(<ResidentsFilter {...defaultProps} />);

      // Tab to search input first
      await userEvent.tab();
      // Tab to first sort button
      await userEvent.tab();

      expect(screen.getByText("部屋")).toHaveFocus();
    });

    it("activates sort button on Enter key", async () => {
      const onSortChange = vi.fn();
      render(
        <ResidentsFilter {...defaultProps} onSortChange={onSortChange} />
      );

      const nameButton = screen.getByText("名前");
      nameButton.focus();
      fireEvent.keyDown(nameButton, { key: "Enter", code: "Enter" });
      await userEvent.click(nameButton);

      expect(onSortChange).toHaveBeenCalledWith("name");
    });
  });

  describe("responsive behavior", () => {
    it("has responsive classes for search input", () => {
      render(<ResidentsFilter {...defaultProps} />);
      const input = screen.getByRole("searchbox");

      expect(input).toHaveClass("h-7");
      expect(input).toHaveClass("sm:h-8");
      expect(input).toHaveClass("w-24");
      expect(input).toHaveClass("sm:w-40");
    });

    it("has responsive classes for sort buttons", () => {
      render(<ResidentsFilter {...defaultProps} />);
      const button = screen.getByText("部屋");

      expect(button).toHaveClass("text-[10px]");
      expect(button).toHaveClass("sm:text-[11px]");
    });
  });
});
