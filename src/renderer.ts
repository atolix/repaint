import { createProgram } from "./shader";
import vertexSource from "./shaders/fullscreen.vert?raw";
import { Framebuffer } from "./framebuffer";
import { resolveIncludes } from "./shader-loader";

type UniformValue =
  | {
    type: "1f";
    value: number;
  }
  | {
    type: "1i";
    value: number;
  }
  | {
    type: "2f";
    value: [number, number];
  };

type TextureUniform = {
  name: string;
  texture: WebGLTexture;
};

type FullscreenPassOptions = {
  program: WebGLProgram;
  framebuffer?: Framebuffer | null;
  uniforms?: Record<string, UniformValue>;
  textures?: TextureUniform[];
};

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private canvas: HTMLCanvasElement;
  private debugMode = 0;

  private sceneFramebuffer: Framebuffer;
  private postProgram: WebGLProgram;

  constructor(
    canvas: HTMLCanvasElement,
    fragmentSource: string,
    postFragmentSource: string
  ) {
    const gl = canvas.getContext("webgl2");

    if (!gl) throw new Error("webgl2 not supported");

    this.gl = gl;
    this.canvas = canvas;

    this.program = createProgram(gl, vertexSource, fragmentSource);

    window.addEventListener("keydown", (event) => {
      if (event.key === "d") {
        this.debugMode = (this.debugMode + 1) % 4;
        console.log("debug mode:", this.debugMode);
      }
    })

    this.sceneFramebuffer = new Framebuffer(gl);
    this.postProgram = createProgram(gl, vertexSource, postFragmentSource);
  }

  private createProgram(fragmentSource: string) {
    return createProgram(this.gl, vertexSource, fragmentSource)
  }

  private drawFullscreenPass(options: FullscreenPassOptions) {
    const {
      program,
      framebuffer = null,
      uniforms = {},
      textures = [],
    } = options;

    if (framebuffer) {
      framebuffer.bind();
    } else {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    this.gl.useProgram(program);

    for (const [name, uniform] of Object.entries(uniforms)) {
      const location = this.gl.getUniformLocation(program, name);

      if (location === null) continue;

      switch (uniform.type) {
        case "1f":
          this.gl.uniform1f(location, uniform.value);
          break;
        case "1i":
          this.gl.uniform1i(location, uniform.value);
          break;
        case "2f":
          this.gl.uniform2f(
            location,
            uniform.value[0],
            uniform.value[1]
          );
          break;
      }
    }

    textures.forEach((textureUniform, index) => {
      const location = this.gl.getUniformLocation(
        program,
        textureUniform.name
      );

      if (location === null) return;

      this.gl.activeTexture(this.gl.TEXTURE0 + index);
      this.gl.bindTexture(this.gl.TEXTURE_2D, textureUniform.texture);
      this.gl.uniform1i(location, index);
    });

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  updateFragmentShader(fragmentSource: string): string | null {
    try {
      const nextProgram = this.createProgram(fragmentSource)

      this.gl.deleteProgram(this.program)
      this.program = nextProgram

      return null
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  updatePostShader(fragmentSource: string): string | null {
    try {
      const nextProgram = createProgram(
        this.gl,
        vertexSource,
        resolveIncludes(fragmentSource, "./shaders/post.frag")
      );

      this.gl.deleteProgram(this.postProgram);
      this.postProgram = nextProgram;

      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(time: number) {
    this.resize();

    this.sceneFramebuffer.resize(
      this.canvas.width,
      this.canvas.height
    );

    const t = time * 0.001;
    const resolution: [number, number] = [
      this.canvas.width,
      this.canvas.height,
    ];

    this.drawFullscreenPass({
      program: this.program,
      framebuffer: this.sceneFramebuffer,
      uniforms: {
        u_time: { type: "1f", value: t },
        u_debugMode: { type: "1i", value: this.debugMode },
        u_resolution: { type: "2f", value: resolution },
      },
    });

    this.drawFullscreenPass({
      program: this.postProgram,
      framebuffer: null,
      uniforms: {
        u_time: { type: "1f", value: t },
        u_debugMode: { type: "1i", value: this.debugMode },
        u_resolution: { type: "2f", value: resolution },
      },
      textures: [
        {
          name: "u_scene",
          texture: this.sceneFramebuffer.texture,
        },
      ],
    });
  }
}
