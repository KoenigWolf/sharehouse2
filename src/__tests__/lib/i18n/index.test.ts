import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTranslator, getTranslations, ja, en } from "@/lib/i18n";

describe("getTranslations", () => {
  it("returns Japanese translations by default", () => {
    const translations = getTranslations();
    expect(translations).toBe(ja);
  });

  it("returns English translations when requested", () => {
    const translations = getTranslations("en");
    expect(translations).toBe(en);
  });
});

describe("t (translation function)", () => {
  const t = createTranslator("ja");
  const tUnsafe = t as (key: string, params?: Record<string, string | number>) => string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("basic translation lookup", () => {
    it("returns correct translation for simple key", () => {
      expect(t("common.loading")).toBe("読み込み中...");
    });

    it("returns correct translation for nested key", () => {
      expect(t("auth.login")).toBe("Login");
    });

    it("returns correct translation for deeply nested key", () => {
      expect(t("profile.completionItems.photo")).toBe("写真");
    });
  });

  describe("all translation categories", () => {
    it("translates common keys", () => {
      expect(t("common.save")).toBe("保存");
      expect(t("common.cancel")).toBe("Cancel");
      expect(t("common.edit")).toBe("編集");
      expect(t("common.back")).toBe("戻る");
    });

    it("translates navigation keys", () => {
      expect(t("nav.home")).toBe("Home");
      expect(t("nav.residents")).toBe("住民");
      expect(t("nav.teaTime")).toBe("Tea Time");
      expect(t("nav.logout")).toBe("Logout");
    });

    it("translates auth keys", () => {
      expect(t("auth.login")).toBe("Login");
      expect(t("auth.signup")).toBe("新規登録");
      expect(t("auth.email")).toBe("メールアドレス");
      expect(t("auth.password")).toBe("パスワード");
    });

    it("translates profile keys", () => {
      expect(t("profile.title")).toBe("Profile");
      expect(t("profile.bio")).toBe("自己紹介");
      expect(t("profile.interests")).toBe("趣味・関心");
    });

    it("translates residents keys", () => {
      expect(t("residents.title")).toBe("住民一覧");
      expect(t("residents.registered")).toBe("登録済み");
    });

    it("translates teaTime keys", () => {
      expect(t("teaTime.title")).toBe("ティータイム");
      expect(t("teaTime.participating")).toBe("参加中");
      expect(t("teaTime.hadTea")).toBe("お茶した");
    });

    it("translates error keys", () => {
      expect(t("errors.unauthorized")).toBe("認証が必要です");
      expect(t("errors.serverError")).toBe("Server Error が発生しました");
    });

    it("translates accessibility keys", () => {
      expect(t("a11y.mainNavigation")).toBe("メインナビゲーション");
      expect(t("a11y.searchResidents")).toBe("住民を検索");
    });
  });

  describe("missing key handling", () => {
    it("returns key when translation not found", () => {
      const result = tUnsafe("nonexistent.key");
      expect(result).toBe("nonexistent.key");
    });

    it("logs warning for missing key", () => {
      tUnsafe("nonexistent.key");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Translation key not found: nonexistent.key"
      );
    });

    it("returns key when partial path exists but final key missing", () => {
      const result = tUnsafe("common.nonexistent");
      expect(result).toBe("common.nonexistent");
    });

    it("logs warning when value is not a string (nested object)", () => {
      // Trying to get a non-leaf value
      const result = tUnsafe("common");
      expect(result).toBe("common");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("parameter interpolation", () => {
    it("replaces single parameter", () => {
      const result = t("auth.passwordMinLength", { min: 10 });
      expect(result).toBe("パスワードは10文字以上で入力してください");
    });
  });

  describe("edge cases", () => {
    it("handles empty string key", () => {
      const result = tUnsafe("");
      expect(result).toBe("");
    });

    it("handles key with only dots", () => {
      const result = tUnsafe("...");
      expect(result).toBe("...");
    });

    it("handles key with leading dot", () => {
      const result = tUnsafe(".common.loading");
      expect(result).toBe(".common.loading");
    });

    it("handles key with trailing dot", () => {
      const result = tUnsafe("common.loading.");
      expect(result).toBe("common.loading.");
    });
  });
});

describe("ja translations structure", () => {
  it("has all required top-level categories", () => {
    expect(ja).toHaveProperty("common");
    expect(ja).toHaveProperty("nav");
    expect(ja).toHaveProperty("auth");
    expect(ja).toHaveProperty("profile");
    expect(ja).toHaveProperty("residents");
    expect(ja).toHaveProperty("teaTime");
    expect(ja).toHaveProperty("errors");
    expect(ja).toHaveProperty("a11y");
  });

  it("common category has required keys", () => {
    expect(ja.common).toHaveProperty("loading");
    expect(ja.common).toHaveProperty("save");
    expect(ja.common).toHaveProperty("cancel");
    expect(ja.common).toHaveProperty("edit");
    expect(ja.common).toHaveProperty("back");
  });

  it("auth category has required keys", () => {
    expect(ja.auth).toHaveProperty("login");
    expect(ja.auth).toHaveProperty("signup");
    expect(ja.auth).toHaveProperty("email");
    expect(ja.auth).toHaveProperty("password");
    expect(ja.auth).toHaveProperty("invalidCredentials");
  });

  it("errors category has required keys", () => {
    expect(ja.errors).toHaveProperty("unauthorized");
    expect(ja.errors).toHaveProperty("serverError");
    expect(ja.errors).toHaveProperty("networkError");
    expect(ja.errors).toHaveProperty("unknownError");
  });

  it("all translation values are strings", () => {
    const checkStrings = (obj: Record<string, unknown>, path = ""): void => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        if (typeof value === "object" && value !== null) {
          checkStrings(value as Record<string, unknown>, currentPath);
        } else {
          expect(
            typeof value,
            `${currentPath} should be a string`
          ).toBe("string");
        }
      }
    };
    checkStrings(ja as unknown as Record<string, unknown>);
  });
});
