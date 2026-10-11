import { createProgram } from "../../gl/program";
import type {
  PostProcessPassConfig,
  PostProcessShaderSources,
} from "./types";

type NamedProgram = {
  name: string;
  program: WebGLProgram;
};

export class PostProcessPrograms {
  readonly output: WebGLProgram;

  private readonly gl: WebGL2RenderingContext;
  private readonly shaderSources: PostProcessShaderSources;
  private passes: NamedProgram[];

  constructor(
    gl: WebGL2RenderingContext,
    shaderSources: PostProcessShaderSources,
    passConfigs: readonly PostProcessPassConfig[],
  ) {
    this.gl = gl;
    this.shaderSources = shaderSources;
    this.output = createProgram(
      gl,
      shaderSources.vertex,
      shaderSources.output,
    );

    try {
      this.passes = this.compilePasses(passConfigs);
    } catch (error) {
      gl.deleteProgram(this.output);
      throw error;
    }
  }

  getPass(index: number) {
    return this.passes[index].program;
  }

  update(passConfigs: readonly PostProcessPassConfig[]): string | null {
    let nextPasses: NamedProgram[];

    try {
      nextPasses = this.compilePasses(passConfigs);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }

    for (const pass of this.passes) this.gl.deleteProgram(pass.program);
    this.passes = nextPasses;

    return null;
  }

  dispose() {
    this.gl.deleteProgram(this.output);
    for (const pass of this.passes) this.gl.deleteProgram(pass.program);
  }

  private compilePasses(passConfigs: readonly PostProcessPassConfig[]) {
    const passes: NamedProgram[] = [];

    try {
      for (const passConfig of passConfigs) {
        passes.push({
          name: passConfig.name,
          program: createProgram(
            this.gl,
            this.shaderSources.vertex,
            passConfig.source,
          ),
        });
      }
    } catch (error) {
      for (const pass of passes) this.gl.deleteProgram(pass.program);

      const failedConfig = passConfigs[passes.length];
      throw new Error(formatPassError(failedConfig, error));
    }

    return passes;
  }
}

function formatPassError(passConfig: PostProcessPassConfig, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return [
    `post-process shader error: ${passConfig.name}`,
    `path: ${passConfig.path}`,
    message,
  ].join("\n");
}
