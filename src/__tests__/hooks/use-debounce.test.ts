import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("does not update value before delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 300 } }
    );

    rerender({ value: "updated", delay: 300 });

    // Advance timer but not past delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("initial");
  });

  it("updates value after delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 300 } }
    );

    rerender({ value: "updated", delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("updated");
  });

  it("resets timer on rapid value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 300 } }
    );

    rerender({ value: "first", delay: 300 });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "second", delay: 300 });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should still be initial because timer was reset
    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Now should be second (300ms after "second" was set)
    expect(result.current).toBe("second");
  });

  it("works with different value types", () => {
    // Number
    const { result: numberResult, rerender: rerenderNumber } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 42, delay: 100 } }
    );
    expect(numberResult.current).toBe(42);
    rerenderNumber({ value: 100, delay: 100 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(numberResult.current).toBe(100);

    // Object
    const obj1 = { key: "value1" };
    const obj2 = { key: "value2" };
    const { result: objectResult, rerender: rerenderObject } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: obj1, delay: 100 } }
    );
    expect(objectResult.current).toBe(obj1);
    rerenderObject({ value: obj2, delay: 100 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(objectResult.current).toBe(obj2);

    // Array
    const arr1 = [1, 2, 3];
    const arr2 = [4, 5, 6];
    const { result: arrayResult, rerender: rerenderArray } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: arr1, delay: 100 } }
    );
    expect(arrayResult.current).toBe(arr1);
    rerenderArray({ value: arr2, delay: 100 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(arrayResult.current).toBe(arr2);

    // Boolean
    const { result: boolResult, rerender: rerenderBool } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: true, delay: 100 } }
    );
    expect(boolResult.current).toBe(true);
    rerenderBool({ value: false, delay: 100 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(boolResult.current).toBe(false);
  });

  it("respects different delay values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    rerender({ value: "updated", delay: 500 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("updated");
  });

  it("handles zero delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 0 } }
    );

    rerender({ value: "updated", delay: 0 });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe("updated");
  });
});
