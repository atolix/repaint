import { describe, expect, it } from "vitest";
import { createPostProcessPasses } from "../src/pipeline/post-process/config";

describe("post-process config", () => {
  it("describes every registered effect", () => {
    const passes = createPostProcessPasses((source) => source);

    expect(passes).toHaveLength(19);
    expect(passes.every((pass) => pass.description.trim().length > 0)).toBe(true);
  });

  it("exposes adjustable parameters for every registered effect", () => {
    const passes = createPostProcessPasses((source) => source);

    expect(passes.every((pass) => (pass.parameters?.length ?? 0) > 0)).toBe(true);
  });
});
