export class Framebuffer {
  private gl: WebGL2RenderingContext;

  readonly framebuffer: WebGLFramebuffer;
  readonly texture: WebGLTexture;

  width = 0;
  height = 0;

  constructor(gl: WebGL2RenderingContext) {
    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();

    if (!framebuffer) throw new Error("failed to create framebuffer");

    if (!texture) throw new Error("failed to create texture");

    this.gl = gl;
    this.framebuffer = framebuffer;
    this.texture = texture;
  }

  resize(width: number, height: number) {
    if (this.width === width && this.height === height) return;

    this.width = width;
    this.height = height;

    const gl = this.gl;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
  }

  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}
