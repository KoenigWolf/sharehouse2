import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ErrorCode,
  AppError,
  getErrorMessage,
  success,
  error,
  handleError,
  logError,
} from "@/lib/errors";

describe("ErrorCode", () => {
  it("has authentication error codes", () => {
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.INVALID_CREDENTIALS).toBe("INVALID_CREDENTIALS");
    expect(ErrorCode.EMAIL_ALREADY_EXISTS).toBe("EMAIL_ALREADY_EXISTS");
    expect(ErrorCode.WEAK_PASSWORD).toBe("WEAK_PASSWORD");
    expect(ErrorCode.EMAIL_NOT_CONFIRMED).toBe("EMAIL_NOT_CONFIRMED");
  });

  it("has validation error codes", () => {
    expect(ErrorCode.INVALID_INPUT).toBe("INVALID_INPUT");
    expect(ErrorCode.REQUIRED_FIELD).toBe("REQUIRED_FIELD");
    expect(ErrorCode.INVALID_FORMAT).toBe("INVALID_FORMAT");
  });

  it("has resource error codes", () => {
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCode.CONFLICT).toBe("CONFLICT");
  });

  it("has server error codes", () => {
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCode.DATABASE_ERROR).toBe("DATABASE_ERROR");
    expect(ErrorCode.NETWORK_ERROR).toBe("NETWORK_ERROR");
  });

  it("has file error codes", () => {
    expect(ErrorCode.FILE_TOO_LARGE).toBe("FILE_TOO_LARGE");
    expect(ErrorCode.INVALID_FILE_TYPE).toBe("INVALID_FILE_TYPE");
    expect(ErrorCode.UPLOAD_FAILED).toBe("UPLOAD_FAILED");
  });
});

describe("AppError", () => {
  it("creates error with code and message", () => {
    const appError = new AppError(ErrorCode.UNAUTHORIZED, "Custom message");
    expect(appError.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(appError.message).toBe("Custom message");
    expect(appError.name).toBe("AppError");
  });

  it("creates error with code only (uses default message)", () => {
    const appError = new AppError(ErrorCode.UNAUTHORIZED);
    expect(appError.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(appError.message).toBeTruthy();
  });

  it("creates error with details", () => {
    const appError = new AppError(ErrorCode.INVALID_INPUT, "Error", {
      field: "email",
    });
    expect(appError.details).toEqual({ field: "email" });
  });

  it("is instanceof Error", () => {
    const appError = new AppError(ErrorCode.UNAUTHORIZED);
    expect(appError instanceof Error).toBe(true);
  });
});

describe("getErrorMessage", () => {
  it("returns message for UNAUTHORIZED", () => {
    const message = getErrorMessage(ErrorCode.UNAUTHORIZED);
    expect(message).toBe("認証が必要です");
  });

  it("returns message for INVALID_CREDENTIALS", () => {
    const message = getErrorMessage(ErrorCode.INVALID_CREDENTIALS);
    expect(message).toBe("メールアドレスまたはパスワードが正しくありません");
  });

  it("returns message for NOT_FOUND", () => {
    const message = getErrorMessage(ErrorCode.NOT_FOUND);
    expect(message).toBe("見つかりませんでした");
  });

  it("returns message for INTERNAL_ERROR", () => {
    const message = getErrorMessage(ErrorCode.INTERNAL_ERROR);
    expect(message).toBe("Server Error が発生しました");
  });

  it("returns message for FILE_TOO_LARGE", () => {
    const message = getErrorMessage(ErrorCode.FILE_TOO_LARGE);
    expect(message).toBe("ファイルサイズは5MB以下にしてください");
  });

  it("returns unknown error message for invalid code", () => {
    const message = getErrorMessage("INVALID_CODE" as typeof ErrorCode.UNAUTHORIZED);
    expect(message).toBe("エラーが発生しました");
  });
});

describe("success", () => {
  it("creates success response with data", () => {
    const response = success({ id: 1, name: "Test" });
    expect(response).toEqual({
      success: true,
      data: { id: 1, name: "Test" },
    });
  });

  it("creates success response with string data", () => {
    const response = success("OK");
    expect(response).toEqual({
      success: true,
      data: "OK",
    });
  });

  it("creates success response with null data", () => {
    const response = success(null);
    expect(response).toEqual({
      success: true,
      data: null,
    });
  });
});

describe("error", () => {
  it("creates error response with message only", () => {
    const response = error("Something went wrong");
    expect(response).toEqual({
      success: false,
      error: "Something went wrong",
    });
  });

  it("creates error response with message and code", () => {
    const response = error("Not authorized", ErrorCode.UNAUTHORIZED);
    expect(response).toEqual({
      success: false,
      error: "Not authorized",
      code: ErrorCode.UNAUTHORIZED,
    });
  });
});

describe("handleError", () => {
  it("handles AppError", () => {
    const appError = new AppError(ErrorCode.UNAUTHORIZED, "Access denied");
    const result = handleError(appError);
    expect(result).toEqual({
      error: "Access denied",
      code: ErrorCode.UNAUTHORIZED,
    });
  });

  it("handles standard Error", () => {
    const standardError = new Error("Generic error");
    const result = handleError(standardError);
    expect(result).toEqual({
      error: "Generic error",
    });
  });

  it("maps 'already registered' error to EMAIL_ALREADY_EXISTS", () => {
    const registeredError = new Error("User already registered");
    const result = handleError(registeredError);
    expect(result.code).toBe(ErrorCode.EMAIL_ALREADY_EXISTS);
  });

  it("maps 'Invalid login' error to INVALID_CREDENTIALS", () => {
    const loginError = new Error("Invalid login credentials");
    const result = handleError(loginError);
    expect(result.code).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it("handles non-Error types", () => {
    const result = handleError("String error");
    expect(result).toEqual({
      error: "エラーが発生しました",
      code: ErrorCode.INTERNAL_ERROR,
    });
  });

  it("handles null", () => {
    const result = handleError(null);
    expect(result).toEqual({
      error: "エラーが発生しました",
      code: ErrorCode.INTERNAL_ERROR,
    });
  });

  it("handles undefined", () => {
    const result = handleError(undefined);
    expect(result).toEqual({
      error: "エラーが発生しました",
      code: ErrorCode.INTERNAL_ERROR,
    });
  });
});

describe("logError", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs Error with context", () => {
    const testError = new Error("Test error");
    logError(testError, { action: "testAction", userId: "user123" });

    expect(consoleSpy).toHaveBeenCalled();
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][1] as string);

    expect(loggedData.action).toBe("testAction");
    expect(loggedData.userId).toBe("user123");
    expect(loggedData.error.name).toBe("Error");
    expect(loggedData.error.message).toBe("Test error");
    expect(loggedData.timestamp).toBeTruthy();
  });

  it("logs AppError with full details", () => {
    const appError = new AppError(ErrorCode.UNAUTHORIZED, "Denied", {
      resource: "profile",
    });
    logError(appError, { action: "accessProfile" });

    expect(consoleSpy).toHaveBeenCalled();
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][1] as string);

    expect(loggedData.action).toBe("accessProfile");
    expect(loggedData.error.name).toBe("AppError");
    expect(loggedData.error.message).toBe("Denied");
  });

  it("logs non-Error types", () => {
    logError("String error message");

    expect(consoleSpy).toHaveBeenCalled();
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][1] as string);

    expect(loggedData.error.message).toBe("String error message");
  });

  it("logs with metadata", () => {
    const testError = new Error("Test");
    logError(testError, {
      action: "test",
      metadata: { requestId: "abc123", path: "/api/test" },
    });

    const loggedData = JSON.parse(consoleSpy.mock.calls[0][1] as string);

    expect(loggedData.metadata.requestId).toBe("abc123");
    expect(loggedData.metadata.path).toBe("/api/test");
  });

  it("logs without context", () => {
    const testError = new Error("Standalone error");
    logError(testError);

    expect(consoleSpy).toHaveBeenCalled();
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][1] as string);

    expect(loggedData.error.message).toBe("Standalone error");
    expect(loggedData.timestamp).toBeTruthy();
  });
});
