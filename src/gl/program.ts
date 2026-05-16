export function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);

  if (!shader) throw new Error("failed to create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);

    throw new Error(log ?? "shader compile error");
  }

  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
) {
  const program = gl.createProgram();

  if (!program) throw new Error("failed to create program");

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);

    throw new Error(log ?? "program link error");
  }

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}
