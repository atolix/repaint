import { describe, expect, it } from "vitest";
import {
  applyPostProcessSnapshot,
  PostProcessState,
} from "../src/pipeline/post-process/state";

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

  it("publishes the latest pass description", () => {
    const state = new PostProcessState([
      { name: "first", description: "Original description.", enabled: false },
    ]);

    state.reconcile([
      { name: "first", description: "Updated description.", enabled: false },
    ]);

    expect(state.snapshot[0].description).toBe("Updated description.");
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

  it("updates, clamps, and resets numeric parameters", () => {
    const state = new PostProcessState([
      {
        name: "noise",
        enabled: false,
        parameters: [
          {
            key: "amount",
            label: "Amount",
            uniform: "u_amount",
            min: 0,
            max: 0.5,
            step: 0.01,
            defaultValue: 0.08,
          },
        ],
      },
    ]);

    expect(state.setParameter("noise", "amount", 2)).toEqual({
      passName: "noise",
      key: "amount",
      value: 0.5,
    });
    expect(state.snapshot[0].parameters?.[0].value).toBe(0.5);

    expect(state.resetPassParameters("noise")).toBe(true);
    expect(state.snapshot[0].parameters?.[0].value).toBe(0.08);
  });

  it("preserves parameter values by pass and key when reconciled", () => {
    const parameter = {
      key: "amount",
      label: "Amount",
      uniform: "u_amount",
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: 0.2,
    };
    const state = new PostProcessState([
      { name: "noise", enabled: false, parameters: [parameter] },
    ]);
    state.setParameter("noise", "amount", 0.7);

    state.reconcile([
      {
        name: "noise",
        enabled: false,
        parameters: [{ ...parameter, label: "Strength" }],
      },
    ]);

    expect(state.snapshot[0].parameters?.[0]).toMatchObject({
      label: "Strength",
      value: 0.7,
    });
  });

  it("returns defensive snapshots", () => {
    const state = new PostProcessState([
      { name: "first", enabled: false },
    ]);
    const snapshot = state.snapshot;
    snapshot[0].enabled = true;

    expect(state.snapshot[0].enabled).toBe(false);
  });

  it("rejects duplicate and invalid parameter definitions", () => {
    const parameter = {
      key: "amount",
      label: "Amount",
      uniform: "u_amount",
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: 0.2,
    };

    expect(() =>
      new PostProcessState([
        {
          name: "noise",
          enabled: false,
          parameters: [parameter, parameter],
        },
      ]),
    ).toThrow("duplicate post-process parameter: noise.amount");
    expect(() =>
      new PostProcessState([
        {
          name: "noise",
          enabled: false,
          parameters: [{ ...parameter, defaultValue: 2 }],
        },
      ]),
    ).toThrow("invalid post-process parameter: noise.amount");
  });

  it("applies enabled and parameter values to replacement configs", () => {
    const parameter = {
      key: "amount",
      label: "Amount",
      uniform: "u_amount",
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: 0.2,
    };

    expect(
      applyPostProcessSnapshot(
        [{ name: "noise", enabled: false, parameters: [parameter] }],
        [
          {
            name: "noise",
            enabled: true,
            parameters: [{ ...parameter, value: 0.7 }],
          },
        ],
      ),
    ).toEqual([
      {
        name: "noise",
        enabled: true,
        parameters: [{ ...parameter, value: 0.7 }],
      },
    ]);
  });
});
