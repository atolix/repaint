import { describe, expect, it, vi } from "vitest";
import { Framebuffer } from "../src/gl/framebuffer";
import { createProgram } from "../src/gl/program";

function createProgramGl(options: {
  compileResults?: boolean[];
  linkResult?: boolean;
} = {}) {
  const shaders = [{ kind: "vertex" }, { kind: "fragment" }];
  const program = { kind: "program" };
  const compileResults = [...(options.compileResults ?? [true, true])];
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    createProgram: vi.fn(() => program),
    createShader: vi.fn(() => shaders.shift() ?? null),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => compileResults.shift() ?? false),
    getShaderInfoLog: vi.fn(() => "compile failed"),
    deleteShader: vi.fn(),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => options.linkResult ?? true),
    getProgramInfoLog: vi.fn(() => "link failed"),
    deleteProgram: vi.fn(),
  };

  return {
    gl: gl as unknown as WebGL2RenderingContext,
    spies: gl,
    program,
  };
}

describe("createProgram", () => {
  it("releases temporary shaders after a successful link", () => {
    const { gl, spies, program } = createProgramGl();

    expect(createProgram(gl, "vertex", "fragment")).toBe(program);
    expect(spies.deleteShader).toHaveBeenCalledTimes(2);
    expect(spies.deleteProgram).not.toHaveBeenCalled();
  });

  it("releases the program and both shaders after fragment compilation fails", () => {
    const { gl, spies, program } = createProgramGl({
      compileResults: [true, false],
    });

    expect(() => createProgram(gl, "vertex", "fragment")).toThrow(
      "compile failed",
    );
    expect(spies.deleteShader).toHaveBeenCalledTimes(2);
    expect(spies.deleteProgram).toHaveBeenCalledWith(program);
  });

  it("releases the program and shaders after linking fails", () => {
    const { gl, spies, program } = createProgramGl({ linkResult: false });

    expect(() => createProgram(gl, "vertex", "fragment")).toThrow(
      "link failed",
    );
    expect(spies.deleteShader).toHaveBeenCalledTimes(2);
    expect(spies.deleteProgram).toHaveBeenCalledWith(program);
  });
});

function createFramebufferGl(statuses: number[] = [100]) {
  const framebuffer = { kind: "framebuffer" };
  const texture = { kind: "texture" };
  const gl = {
    FRAMEBUFFER: 1,
    TEXTURE_2D: 2,
    RGBA: 3,
    UNSIGNED_BYTE: 4,
    TEXTURE_MIN_FILTER: 5,
    TEXTURE_MAG_FILTER: 6,
    LINEAR: 7,
    TEXTURE_WRAP_S: 8,
    TEXTURE_WRAP_T: 9,
    CLAMP_TO_EDGE: 10,
    COLOR_ATTACHMENT0: 11,
    FRAMEBUFFER_COMPLETE: 100,
    createFramebuffer: vi.fn(() => framebuffer),
    createTexture: vi.fn(() => texture),
    deleteFramebuffer: vi.fn(),
    deleteTexture: vi.fn(),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    checkFramebufferStatus: vi.fn(() => statuses.shift() ?? 100),
  };

  return {
    gl: gl as unknown as WebGL2RenderingContext,
    spies: gl,
    framebuffer,
  };
}

describe("Framebuffer", () => {
  it("does not reallocate an unchanged target", () => {
    const { gl, spies } = createFramebufferGl();
    const target = new Framebuffer(gl);

    target.resize(640, 480);
    target.resize(640, 480);

    expect(spies.texImage2D).toHaveBeenCalledTimes(1);
  });

  it("retries allocation after an incomplete framebuffer", () => {
    const { gl, spies } = createFramebufferGl([101, 100]);
    const target = new Framebuffer(gl);

    expect(() => target.resize(640, 480)).toThrow(
      "framebuffer incomplete: 0x65",
    );
    expect(() => target.resize(640, 480)).not.toThrow();
    expect(spies.texImage2D).toHaveBeenCalledTimes(2);
  });

  it("releases the framebuffer when texture creation fails", () => {
    const { gl, spies, framebuffer } = createFramebufferGl();
    spies.createTexture.mockReturnValueOnce(null);

    expect(() => new Framebuffer(gl)).toThrow("failed to create texture");
    expect(spies.deleteFramebuffer).toHaveBeenCalledWith(framebuffer);
  });
});
