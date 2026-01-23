import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  signUpSchema,
  signInSchema,
  validateSignUp,
  validateSignIn,
} from "@/lib/validations/auth";
import { AUTH, PROFILE } from "@/lib/constants/config";

describe("emailSchema", () => {
  it("accepts valid email", () => {
    const result = emailSchema.safeParse("test@example.com");
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = emailSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = emailSchema.safeParse("invalid-email");
    expect(result.success).toBe(false);
  });

  it("rejects email without domain", () => {
    const result = emailSchema.safeParse("test@");
    expect(result.success).toBe(false);
  });

  it("rejects email that is too long", () => {
    const longEmail = "a".repeat(250) + "@example.com";
    const result = emailSchema.safeParse(longEmail);
    expect(result.success).toBe(false);
  });

  it("accepts email with subdomain", () => {
    const result = emailSchema.safeParse("test@mail.example.com");
    expect(result.success).toBe(true);
  });
});

describe("passwordSchema", () => {
  it("accepts valid password", () => {
    const result = passwordSchema.safeParse("password123");
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than minimum", () => {
    const shortPassword = "a".repeat(AUTH.passwordMinLength - 1);
    const result = passwordSchema.safeParse(shortPassword);
    expect(result.success).toBe(false);
  });

  it("accepts password at minimum length", () => {
    const minPassword = "a".repeat(AUTH.passwordMinLength);
    const result = passwordSchema.safeParse(minPassword);
    expect(result.success).toBe(true);
  });

  it("rejects password longer than 128 characters", () => {
    const longPassword = "a".repeat(129);
    const result = passwordSchema.safeParse(longPassword);
    expect(result.success).toBe(false);
  });

  it("accepts password at maximum length", () => {
    const maxPassword = "a".repeat(128);
    const result = passwordSchema.safeParse(maxPassword);
    expect(result.success).toBe(true);
  });
});

describe("nameSchema", () => {
  it("accepts valid name", () => {
    const result = nameSchema.safeParse("山田 太郎");
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = nameSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("trims whitespace from name", () => {
    const result = nameSchema.safeParse("  山田 太郎  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("山田 太郎");
    }
  });

  it("rejects name that exceeds max length", () => {
    const longName = "あ".repeat(PROFILE.nameMaxLength + 1);
    const result = nameSchema.safeParse(longName);
    expect(result.success).toBe(false);
  });

  it("accepts name at max length", () => {
    const maxName = "あ".repeat(PROFILE.nameMaxLength);
    const result = nameSchema.safeParse(maxName);
    expect(result.success).toBe(true);
  });
});

describe("signUpSchema", () => {
  const validData = {
    name: "山田 太郎",
    email: "test@example.com",
    password: "password123",
  };

  it("accepts valid sign up data", () => {
    const result = signUpSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = signUpSchema.safeParse({
      email: validData.email,
      password: validData.password,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = signUpSchema.safeParse({
      name: validData.name,
      password: validData.password,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = signUpSchema.safeParse({
      name: validData.name,
      email: validData.email,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email in sign up", () => {
    const result = signUpSchema.safeParse({
      ...validData,
      email: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password in sign up", () => {
    const result = signUpSchema.safeParse({
      ...validData,
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  const validData = {
    email: "test@example.com",
    password: "password123",
  };

  it("accepts valid sign in data", () => {
    const result = signInSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = signInSchema.safeParse({ password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = signInSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(false);
  });

  it("accepts any non-empty password for sign in", () => {
    // Sign in doesn't enforce password complexity
    const result = signInSchema.safeParse({
      email: "test@example.com",
      password: "1",
    });
    expect(result.success).toBe(true);
  });
});

describe("validateSignUp", () => {
  it("returns success for valid data", () => {
    const result = validateSignUp({
      name: "山田 太郎",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("returns error for invalid data", () => {
    const result = validateSignUp({
      name: "",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("trims name in returned data", () => {
    const result = validateSignUp({
      name: "  山田 太郎  ",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("山田 太郎");
  });
});

describe("validateSignIn", () => {
  it("returns success for valid data", () => {
    const result = validateSignIn({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("returns error for missing email", () => {
    const result = validateSignIn({
      password: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error for missing password", () => {
    const result = validateSignIn({
      email: "test@example.com",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
