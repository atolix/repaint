import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PostProcessPassConfig } from "../src/pipeline/post-process/types";

const fakes = vi.hoisted(() => ({
  createProgram: vi.fn(),
}));

vi.mock("../src/gl/program", () => ({
  createProgram: fakes.createProgram,
}));

import { PostProcessPrograms } from "../src/pipeline/post-process/programs";

const shaderSources = {
  vertex: "vertex",
  output: "output",
};

const passConfigs: PostProcessPassConfig[] = [
  {
    name: "first",
    description: "First pass.",
    path: "first.frag",
    source: "first",
    enabled: false,
  },
  {
    name: "second",
    description: "Second pass.",
    path: "second.frag",
    source: "second",
    enabled: true,
  },
];

function createGl() {
  return {
    deleteProgram: vi.fn(),
  } as unknown as WebGL2RenderingContext;
}

describe("PostProcessPrograms", () => {
  beforeEach(() => {
    fakes.createProgram.mockReset();
  });

  it("cleans up the output and earlier passes when construction fails", () => {
    const gl = createGl();
    const output = {} as WebGLProgram;
    const first = {} as WebGLProgram;
    fakes.createProgram
      .mockReturnValueOnce(output)
      .mockReturnValueOnce(first)
      .mockImplementationOnce(() => {
        throw new Error("compile failed");
      });

    expect(() => new PostProcessPrograms(gl, shaderSources, passConfigs))
      .toThrow("post-process shader error: second\npath: second.frag\ncompile failed");
    expect(gl.deleteProgram).toHaveBeenCalledWith(first);
    expect(gl.deleteProgram).toHaveBeenCalledWith(output);
  });

  it("keeps current pass programs when an update fails", () => {
    const gl = createGl();
    const output = {} as WebGLProgram;
    const first = {} as WebGLProgram;
    const second = {} as WebGLProgram;
    const candidate = {} as WebGLProgram;
    fakes.createProgram
      .mockReturnValueOnce(output)
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second)
      .mockReturnValueOnce(candidate)
      .mockImplementationOnce(() => {
        throw new Error("updated compile failed");
      });
    const programs = new PostProcessPrograms(gl, shaderSources, passConfigs);

    expect(programs.update(passConfigs)).toContain("updated compile failed");
    expect(programs.getPass(0)).toBe(first);
    expect(programs.getPass(1)).toBe(second);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledWith(candidate);
  });

  it("replaces pass programs atomically and owns their disposal", () => {
    const gl = createGl();
    const output = {} as WebGLProgram;
    const first = {} as WebGLProgram;
    const second = {} as WebGLProgram;
    const nextFirst = {} as WebGLProgram;
    fakes.createProgram
      .mockReturnValueOnce(output)
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second)
      .mockReturnValueOnce(nextFirst);
    const programs = new PostProcessPrograms(gl, shaderSources, passConfigs);

    expect(programs.update([passConfigs[0]])).toBeNull();
    expect(programs.getPass(0)).toBe(nextFirst);
    expect(gl.deleteProgram).toHaveBeenCalledWith(first);
    expect(gl.deleteProgram).toHaveBeenCalledWith(second);

    programs.dispose();
    expect(gl.deleteProgram).toHaveBeenCalledWith(output);
    expect(gl.deleteProgram).toHaveBeenCalledWith(nextFirst);
  });
});
