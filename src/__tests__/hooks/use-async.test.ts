import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAsync, useOptimisticAction } from "@/hooks/use-async";

describe("useAsync", () => {
  it("initializes with correct default state", () => {
    const mockFn = vi.fn().mockResolvedValue("data");
    const { result } = renderHook(() => useAsync(mockFn));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("sets isLoading to true when executing", async () => {
    let resolvePromise: (value: string) => void;
    const mockFn = vi.fn(
      () => new Promise<string>((resolve) => (resolvePromise = resolve))
    );

    const { result } = renderHook(() => useAsync(mockFn));

    act(() => {
      result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!("data");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("sets data on successful execution", async () => {
    const mockFn = vi.fn().mockResolvedValue("success data");
    const { result } = renderHook(() => useAsync(mockFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe("success data");
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("sets error on failed execution", async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error("Test error"));
    const { result } = renderHook(() => useAsync(mockFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Test error");
    expect(result.current.isLoading).toBe(false);
  });

  it("handles non-Error rejection", async () => {
    const mockFn = vi.fn().mockRejectedValue("String error");
    const { result } = renderHook(() => useAsync(mockFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBe("エラーが発生しました");
  });

  it("passes arguments to async function", async () => {
    const mockFn = vi.fn().mockResolvedValue("result");
    const { result } = renderHook(() => useAsync(mockFn));

    await act(async () => {
      await result.current.execute("arg1", 123);
    });

    expect(mockFn).toHaveBeenCalledWith("arg1", 123);
  });

  it("returns result from execute", async () => {
    const mockFn = vi.fn().mockResolvedValue("returned value");
    const { result } = renderHook(() => useAsync(mockFn));

    let returnValue = null as string | null;
    await act(async () => {
      returnValue = (await result.current.execute()) as string | null;
    });

    expect(returnValue).toBe("returned value");
  });

  it("returns null from execute on error", async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error("Error"));
    const { result } = renderHook(() => useAsync(mockFn));

    let returnValue = "not null" as string | null;
    await act(async () => {
      returnValue = (await result.current.execute()) as string | null;
    });

    expect(returnValue).toBeNull();
  });

  it("resets state correctly", async () => {
    const mockFn = vi.fn().mockResolvedValue("data");
    const { result } = renderHook(() => useAsync(mockFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe("data");

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useOptimisticAction", () => {
  it("initializes with correct default state", () => {
    const mockAction = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useOptimisticAction(mockAction));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets isLoading during execution", async () => {
    let resolvePromise: (value: { success: boolean }) => void;
    const mockAction = vi.fn(
      () =>
        new Promise<{ success: boolean }>((resolve) => (resolvePromise = resolve))
    );

    const { result } = renderHook(() => useOptimisticAction(mockAction));

    act(() => {
      result.current.execute({ test: "data" });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!({ success: true });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("returns true on successful action", async () => {
    const mockAction = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useOptimisticAction(mockAction));

    let success = false;
    await act(async () => {
      success = await result.current.execute({ test: "data" });
    });

    expect(success).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("returns false and sets error on action error response", async () => {
    const mockAction = vi.fn().mockResolvedValue({ error: "Action failed" });
    const { result } = renderHook(() => useOptimisticAction(mockAction));

    let success = true;
    await act(async () => {
      success = await result.current.execute({ test: "data" });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Action failed");
  });

  it("returns false and sets error on rejection", async () => {
    const mockAction = vi.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useOptimisticAction(mockAction));

    let success = true;
    await act(async () => {
      success = await result.current.execute({ test: "data" });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Network error");
  });

  it("calls onSuccess callback on success", async () => {
    const onSuccess = vi.fn();
    const mockAction = vi.fn().mockResolvedValue({ success: true, id: 123 });

    const { result } = renderHook(() =>
      useOptimisticAction(mockAction, { onSuccess })
    );

    await act(async () => {
      await result.current.execute({ test: "data" });
    });

    expect(onSuccess).toHaveBeenCalledWith({ success: true, id: 123 });
  });

  it("calls onError callback on error response", async () => {
    const onError = vi.fn();
    const mockAction = vi.fn().mockResolvedValue({ error: "Failed" });

    const { result } = renderHook(() =>
      useOptimisticAction(mockAction, { onError })
    );

    await act(async () => {
      await result.current.execute({ test: "data" });
    });

    expect(onError).toHaveBeenCalledWith("Failed");
  });

  it("calls onError callback on rejection", async () => {
    const onError = vi.fn();
    const mockAction = vi.fn().mockRejectedValue(new Error("Rejected"));

    const { result } = renderHook(() =>
      useOptimisticAction(mockAction, { onError })
    );

    await act(async () => {
      await result.current.execute({ test: "data" });
    });

    expect(onError).toHaveBeenCalledWith("Rejected");
  });

  it("clears error correctly", async () => {
    const mockAction = vi.fn().mockResolvedValue({ error: "Error" });
    const { result } = renderHook(() => useOptimisticAction(mockAction));

    await act(async () => {
      await result.current.execute({ test: "data" });
    });

    expect(result.current.error).toBe("Error");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("handles non-Error rejection", async () => {
    const mockAction = vi.fn().mockRejectedValue("String error");
    const { result } = renderHook(() => useOptimisticAction(mockAction));

    await act(async () => {
      await result.current.execute({ test: "data" });
    });

    expect(result.current.error).toBe("エラーが発生しました");
  });
});
