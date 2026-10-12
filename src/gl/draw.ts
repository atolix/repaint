import { Framebuffer } from "./framebuffer";

const uniformLocationCache = new WeakMap<
  WebGLProgram,
  Map<string, WebGLUniformLocation | null>
>();

export type UniformValue =
  | { type: "1f"; value: number }
  | { type: "1i"; value: number }
  | { type: "2f"; value: [number, number] };

export type TextureUniform = {
  name: string;
  texture: WebGLTexture;
};

export type PassOptions = {
  program: WebGLProgram;
  framebuffer?: Framebuffer | null;
  uniforms?: Record<string, UniformValue>;
  textures?: TextureUniform[];
};

export function drawPass(
  gl: WebGL2RenderingContext,
  options: PassOptions
) {
  const {
    program,
    framebuffer = null,
    uniforms = {},
    textures = [],
  } = options;

  if (framebuffer) {
    framebuffer.bind();
  } else {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  gl.useProgram(program);

  for (const [name, uniform] of Object.entries(uniforms)) {
    const location = getUniformLocation(gl, program, name);
    if (location === null) continue;

    switch (uniform.type) {
      case "1f":
        gl.uniform1f(location, uniform.value);
        break;
      case "1i":
        gl.uniform1i(location, uniform.value);
        break;
      case "2f":
        gl.uniform2f(location, uniform.value[0], uniform.value[1]);
        break;
    }
  }

  textures.forEach((textureUniform, index) => {
    const location = getUniformLocation(gl, program, textureUniform.name);
    if (location === null) return;

    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, textureUniform.texture);
    gl.uniform1i(location, index);
  });

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function getUniformLocation(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) {
  let locations = uniformLocationCache.get(program);

  if (!locations) {
    locations = new Map();
    uniformLocationCache.set(program, locations);
  }

  if (!locations.has(name)) {
    locations.set(name, gl.getUniformLocation(program, name));
  }

  return locations.get(name) ?? null;
}
