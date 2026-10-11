import { describe, expect, it } from "vitest";
import { createShaderIncludeResolver } from "../src/gl/include-resolver";

describe("shader include resolver", () => {
  it("resolves nested relative includes", () => {
    const resolver = createShaderIncludeResolver({
      "./shaders/lib/color.glsl": "vec3 color;\n#include \"./nested/value.glsl\"",
      "./shaders/lib/nested/value.glsl": "float value;",
    });

    expect(
      resolver.resolveIncludes(
        "#include \"./lib/color.glsl\"\nvoid main() {}",
        "./shaders/main.frag",
      ),
    ).toBe("vec3 color;\nfloat value;\nvoid main() {}");
  });

  it("ignores include-like text inside comments", () => {
    const resolver = createShaderIncludeResolver({});
    const source = [
      "// #include \"./missing.glsl\"",
      "/* #include \"./also-missing.glsl\" */",
    ].join("\n");

    expect(resolver.resolveIncludes(source)).toBe(source);
  });

  it("reports the full include cycle", () => {
    const resolver = createShaderIncludeResolver({
      "./shaders/a.glsl": "#include \"./b.glsl\"",
      "./shaders/b.glsl": "#include \"./a.glsl\"",
    });

    expect(() =>
      resolver.resolveIncludes(
        "#include \"./a.glsl\"",
        "./shaders/main.frag",
      ),
    ).toThrow(
      "shader include cycle: ./shaders/main.frag -> ./shaders/a.glsl -> ./shaders/b.glsl -> ./shaders/a.glsl",
    );
  });

  it("reports missing includes with their parent path", () => {
    const resolver = createShaderIncludeResolver({});

    expect(() =>
      resolver.resolveIncludes(
        "#include \"./lib/missing.glsl\"",
        "./shaders/main.frag",
      ),
    ).toThrow(
      "shader include not found: ./lib/missing.glsl from ./shaders/main.frag",
    );
  });

  it("collects normalized include graph edges", () => {
    const resolver = createShaderIncludeResolver({
      "./shaders/lib/common.glsl": "float common;",
    });

    expect(
      resolver.collectIncludeGraph([
        {
          path: "./shaders/effects/example.frag",
          source: "#include \"../lib/common.glsl\"",
        },
      ]),
    ).toEqual({
      "./shaders/effects/example.frag": ["./shaders/lib/common.glsl"],
      "./shaders/lib/common.glsl": [],
    });
  });
});
