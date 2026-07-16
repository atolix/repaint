# repaint

A Vite + TypeScript + WebGL2 shader playground.

`repaint` renders the scene shader in `src/shaders/main.frag` to a fullscreen
canvas, then optionally routes that image through a configurable post-process
pipeline. The browser UI is intentionally only the canvas; development feedback
is reported through the Vite terminal logs.

## Requirements

- Node.js
- npm
- A browser with WebGL2 support

## Setup

```sh
npm install
```

## Development

```sh
npm run dev
```

Open the local URL printed by Vite.

While the dev server is running, the custom Vite logger prints:

- the current render pipeline
- canvas render resolution and DPR
- shader compile status
- the GLSL include graph
- shader errors

## Build

```sh
npm run build
```

This runs the TypeScript check and creates a production Vite build.

Preview the production build with:

```sh
npm run preview
```

## Controls

Use these keys while the browser page is focused.

| Key | Action |
| --- | --- |
| `ArrowDown` / `]` | Select the next post-process pass |
| `ArrowUp` / `[` | Select the previous post-process pass |
| `Space` / `Enter` | Toggle the selected post-process pass on or off |
| `Home` | Select the first post-process pass |
| `End` | Select the last post-process pass |
| `1` - `9` | Quick select post-process pass 1-9 |
| `Shift` + `1` - `9` | Quick toggle post-process pass 1-9 |
| `d` | Cycle debug mode from `0` to `3` |

Post-process pass numbers follow the order in
`src/pipeline/post-process/config.ts`. The selection cursor wraps when moving
past the first or last pass, so the cursor controls work even when the effect
list grows beyond the first nine numeric shortcuts.

## Render Pipeline

The current render flow is:

1. `src/main.ts` imports `src/shaders/main.frag` and resolves GLSL `#include`
   directives.
2. `Renderer` creates the WebGL2 context and owns the high-level render loop
   dependencies.
3. `ScenePass` renders the scene shader into an offscreen framebuffer.
4. `PostProcessPipeline` applies enabled effect passes in order.
5. The final texture is drawn to the default framebuffer.

When at least one post-process pass is enabled, the pipeline uses two
framebuffers in a ping-pong pattern between passes. When no post-process pass is
enabled, the scene texture is copied directly to the screen.

## Shader Structure

Primary shader editing points:

| Path | Responsibility |
| --- | --- |
| `src/shaders/main.frag` | Main procedural scene fragment shader |
| `src/shaders/lib/*.glsl` | Shared GLSL utility modules |
| `src/shaders/effects/*.frag` | Post-process effect fragment shaders |
| `src/pipeline/post-process/config.ts` | Effect order, initial enabled state, and shader source registration |
| `src/gl/include.ts` | GLSL `#include` resolution and include graph collection |
| `vite.config.ts` | Dev-server terminal logging for pipeline, resolution, shader status, and includes |

GLSL files can include shared modules with relative paths:

```glsl
#include "./lib/uniforms.glsl"
```

Includes are resolved from Vite raw imports by `src/gl/include.ts`. Missing
includes and include cycles throw errors.

## Post-Process Effects

The current effect passes are all disabled by default.

| Key | Effect |
| --- | --- |
| `1` | `invert` |
| `2` | `noise` |
| `3` | `vignette` |
| `4` | `chromatic-aberration` |
| `5` | `pixelate` |
| `6` | `scanlines` |
| `7` | `posterize` |
| `8` | `sepia` |
| `9` | `edge-detect` |

To add an effect, create a fragment shader in `src/shaders/effects/`, then add
it to `postProcessDefinitions` in `src/pipeline/post-process/config.ts`.

## Hot Reload

During development, Vite HMR updates:

- `src/shaders/main.frag`
- `src/pipeline/post-process/config.ts`
- `src/gl/include.ts`

If shader recompilation fails, the error is printed in the terminal and the
previous render state is preserved where possible.

## Project Layout

```text
.
├── docs/
│   └── development-memo.md
├── index.html
├── src/
│   ├── main.ts
│   ├── renderer.ts
│   ├── hmr.ts
│   ├── style.css
│   ├── debug/
│   │   └── state.ts
│   ├── gl/
│   │   ├── framebuffer.ts
│   │   ├── include.ts
│   │   └── program.ts
│   ├── pass/
│   │   └── draw.ts
│   ├── pipeline/
│   │   ├── log.ts
│   │   ├── scene/
│   │   │   └── index.ts
│   │   └── post-process/
│   │       ├── controls.ts
│   │       ├── config.ts
│   │       └── index.ts
│   └── shaders/
│       ├── fullscreen.vert
│       ├── main.frag
│       ├── output.frag
│       ├── effects/
│       └── lib/
├── vite.config.ts
├── tsconfig.json
├── package.json
└── package-lock.json
```

### Runtime Entry Points

| Path | Responsibility |
| --- | --- |
| `index.html` | Provides the fullscreen `<canvas id="canvas">` and loads `src/main.ts` |
| `src/main.ts` | App bootstrap: loads shaders, resolves includes, creates `Renderer`, wires HMR handlers, and starts `requestAnimationFrame` |
| `src/renderer.ts` | Top-level WebGL renderer: owns the WebGL2 context, resize logic, scene pass, post-process pipeline, and debug state |
| `src/hmr.ts` | Small helpers for shader reloads and Vite websocket events |
| `src/style.css` | Fullscreen black canvas layout |

### WebGL Infrastructure

| Path | Responsibility |
| --- | --- |
| `src/gl/program.ts` | Compiles shaders, links programs, reports compile/link errors, and releases temporary shader objects |
| `src/gl/framebuffer.ts` | Manages framebuffer-backed textures and resizes render targets |
| `src/gl/include.ts` | Resolves GLSL include directives from eagerly imported shader modules and reports dependency graphs |
| `src/pass/draw.ts` | Shared fullscreen draw helper for binding framebuffers, uniforms, textures, and issuing `drawArrays` |

### Render Pipeline

| Path | Responsibility |
| --- | --- |
| `src/pipeline/scene/index.ts` | Renders the main scene fragment shader into an offscreen framebuffer |
| `src/pipeline/post-process/index.ts` | Runs enabled post-process passes, ping-pongs intermediate framebuffers, and writes the final pass to screen |
| `src/pipeline/post-process/config.ts` | Registers all effect shaders and defines pass order plus initial enabled flags |
| `src/pipeline/post-process/controls.ts` | Binds keyboard controls for moving the selected pass, toggling it, and using numeric quick shortcuts |
| `src/pipeline/log.ts` | Sends render-pipeline and resolution state to the Vite dev server logger |
| `src/debug/state.ts` | Tracks the current debug mode and cycles it with the `d` key |

### Shader Assets

| Path | Responsibility |
| --- | --- |
| `src/shaders/fullscreen.vert` | Fullscreen triangle vertex shader shared by scene, effects, and output passes |
| `src/shaders/main.frag` | Current procedural scene shader |
| `src/shaders/output.frag` | Copies a texture to the default framebuffer when no effect pass needs to write directly |
| `src/shaders/effects/*.frag` | Individual post-process effects that read `u_scene` and write `outColor` |
| `src/shaders/lib/uniforms.glsl` | Shared uniform declarations |
| `src/shaders/lib/util.glsl` | Shared coordinate and utility helpers |
| `src/shaders/lib/debug.glsl` | Debug visualization helpers |
| `src/shaders/lib/color.glsl` | Color helpers such as luminance and saturation |
| `src/shaders/lib/noise.glsl` | Noise and hash helpers |
| `src/shaders/lib/sdf.glsl` | Signed-distance-field helpers |
| `src/shaders/lib/easing.glsl` | Easing functions |

### Tooling And Documentation

| Path | Responsibility |
| --- | --- |
| `vite.config.ts` | Defines the Vite config and a custom dev-server logger plugin |
| `tsconfig.json` | TypeScript compiler configuration |
| `package.json` | npm scripts and development dependencies |
| `package-lock.json` | Locked npm dependency tree |
| `docs/development-memo.md` | Project direction notes and future work ideas |

## Notes

- This project is structured as a shader workbench.
- There is no in-browser control panel; effects and initial state are managed in
  source code.
- Canvas render resolution is derived from CSS size and `devicePixelRatio`.
