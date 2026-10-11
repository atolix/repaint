import { describe, expect, it } from "vitest";
import { PostProcessState } from "../src/pipeline/post-process/state";

describe("PostProcessState", () => {
  it("wraps selection in both directions", () => {
    const state = new PostProcessState([
      { name: "first", enabled: false },
      { name: "second", enabled: false },
    ]);

    expect(state.selectPreviousPass()).toEqual({ name: "second", index: 1 });
    expect(state.selectNextPass()).toEqual({ name: "first", index: 0 });
  });

  it("handles selection and toggling with no passes", () => {
    const state = new PostProcessState([]);

    expect(state.selectFirstPass()).toBeNull();
    expect(state.selectLastPass()).toBeNull();
    expect(state.selectNextPass()).toBeNull();
    expect(state.toggleSelectedPass()).toBeNull();
  });

  it("toggles the selected pass", () => {
    const state = new PostProcessState([
      { name: "first", enabled: false },
      { name: "second", enabled: false },
    ]);

    state.selectPassAt(1);

    expect(state.toggleSelectedPass()).toEqual({
      name: "second",
      enabled: true,
      index: 1,
    });
    expect(state.enabledByName.get("second")).toBe(true);
  });

  it("preserves enabled and selected state by name when reconciled", () => {
    const state = new PostProcessState([
      { name: "first", enabled: false },
      { name: "second", enabled: false },
    ]);
    state.selectPassAt(1);
    state.toggleSelectedPass();

    state.reconcile([
      { name: "second", enabled: false },
      { name: "new", enabled: true },
      { name: "first", enabled: false },
    ]);

    expect(state.selectedPassIndex).toBe(0);
    expect(state.snapshot).toEqual([
      { name: "second", enabled: true },
      { name: "new", enabled: true },
      { name: "first", enabled: false },
    ]);
  });

  it("clamps selection when the selected pass is removed", () => {
    const state = new PostProcessState([
      { name: "first", enabled: false },
      { name: "second", enabled: false },
      { name: "third", enabled: false },
    ]);
    state.selectLastPass();

    state.reconcile([{ name: "first", enabled: false }]);

    expect(state.selectedPassIndex).toBe(0);
  });

  it("rejects duplicate pass names", () => {
    expect(() =>
      new PostProcessState([
        { name: "same", enabled: false },
        { name: "same", enabled: true },
      ]),
    ).toThrow("duplicate post-process pass: same");
  });
});
