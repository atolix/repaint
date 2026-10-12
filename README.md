# repaint

A Vite + TypeScript + WebGL2 shader playground.

`repaint` renders the scene shader in `src/shaders/main.frag` to a fullscreen
canvas, then optionally routes that image through a configurable post-process
pipeline. The browser UI keeps the canvas full-screen and overlays a collapsible
effect inspector and playback controls. Development diagnostics are also
reported through the Vite terminal logs.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
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

While the dev server is running, the custom Vite logger renders a terminal
dashboard with:

- the current render pipeline
- canvas render resolution and DPR
- shader compile status
- the GLSL include graph
- shader errors

In an interactive TTY, the dashboard is repainted in place with ANSI escape
sequences. In CI or non-TTY output, it falls back to normal appended logs.

## Build

```sh
npm run build
```

This runs the TypeScript check and creates a production Vite build.

Preview the production build with:

```sh
npm run preview
```

Run the local unit tests with:

```sh
npm test
```

Run the full TypeScript check, including tests and Vite configuration:

```sh
npm run typecheck
```

Run the local browser smoke test with a Chromium-compatible executable:

```sh
npm run test:browser
```

The browser test starts an ephemeral Vite server, opens the page in headless
Chromium with software WebGL, and checks that WebGL initialization succeeds
without browser errors. It uses `chromium` by default; set `CHROMIUM_PATH` to
use a different executable.

## Controls

Use these keys while the browser page is focused.

| Key | Action |
| --- | --- |
| `ArrowDown` / `]` | Select the next post-process pass |
| `ArrowUp` / `[` | Select the previous post-process pass |
| `Enter` | Toggle the selected post-process pass on or off |
| `Space` | Pause or resume shader-time playback |
| `ArrowRight` | Step forward one frame while paused |
| `ArrowLeft` | Step backward one frame while paused |
| `Home` | Select the first post-process pass |
| `End` | Select the last post-process pass |
| `1` - `9` | Quick select post-process pass 1-9 |
| `Shift` + `1` - `9` | Quick toggle post-process pass 1-9 |
| `d` | Cycle debug mode from `0` to `6` |
| `p` | Show the effect inspector |
| `q` | Hide the effect inspector |

Post-process pass numbers follow the order in
`src/pipeline/post-process/config.ts`. The selection cursor wraps when moving
past the first or last pass, so the cursor controls work even when the effect
list grows beyond the first nine numeric shortcuts. The inspector automatically
scrolls to keep the keyboard selection visible while leaving its scrollbar
hidden.

## Render Pipeline

The current render flow is:

1. `src/main.ts` imports `src/shaders/main.frag` and resolves GLSL `#include`
   directives.
2. `Renderer` owns canvas sizing and WebGL context loss/restoration.
3. `RenderResources` owns the replaceable scene and post-process resources.
4. `ScenePass` renders the scene shader into an offscreen framebuffer.
5. `PostProcessPipeline` builds a render plan and applies enabled effects.
6. The final texture is drawn to the default framebuffer.

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
| `vite.config.ts` | Dev-server terminal dashboard for pipeline, resolution, shader status, and includes |

GLSL files can include shared modules with relative paths:

```glsl
#include "./lib/uniforms.glsl"
```

Includes are resolved from Vite raw imports by `src/gl/include.ts`. Missing
includes and include cycles throw errors.

## Post-Process Effects

The current effect passes are all disabled by default.

| Position | Numeric shortcut | Effect | Parameters |
| --- | --- | --- | --- |
| 1 | `1` | `invert` | Amount |
| 2 | `2` | `noise` | Amount |
| 3 | `3` | `vignette` | Radius, softness |
| 4 | `4` | `chromatic-aberration` | Amount |
| 5 | `5` | `pixelate` | Pixel size |
| 6 | `6` | `scanlines` | Intensity, frequency |
| 7 | `7` | `posterize` | Levels |
| 8 | `8` | `sepia` | Amount |
| 9 | `9` | `edge-detect` | Threshold, mix |
| 10 | — | `grayscale` | Amount |
| 11 | — | `threshold` | Threshold |
| 12 | — | `glitch` | Strength, speed, bands |
| 13 | — | `barrel-distortion` | Strength |
| 14 | — | `wave-distortion` | Amplitude, frequency, speed |
| 15 | — | `contrast` | Contrast |
| 16 | — | `duotone` | Amount |
| 17 | — | `swirl` | Angle, radius |
| 18 | — | `mirror` | Amount |
| 19 | — | `emboss` | Strength, color mix |

Use the arrow or bracket controls to select effects beyond the first nine.

## Effect Inspector

The inspector is overlaid on the right side of the canvas. Press `p` to show it,
press `q` to hide it, or use its bottom-right button. Parameters for the selected
effect open in a top-aligned flyout to the left of the pass list, so moving the
selection does not move the controls vertically. It provides:

- selection and ON/OFF controls for every post-process pass
- a description of the selected effect
- sliders and numeric inputs for the selected pass
- per-pass parameter reset

Parameter definitions live beside effect registration in
`src/pipeline/post-process/config.ts`. Values are clamped by the state layer,
preserved across compatible HMR updates, and passed to shaders as uniforms.

## Playback Controls

The bottom-left controls show elapsed shader time and operate on it without
stopping the render loop. They provide pause/resume, reset to zero, one 60 fps
frame step while paused, and `0.25×`, `0.5×`, `1×`, or `2×` playback speed.
The `Save PNG` button downloads the current canvas at its rendered pixel
resolution. The browser interface is not included in the image. `Space` also
pauses or resumes playback. Keeping the render loop active while
paused lets UI and WebGL context events continue normally. While paused, use
the right and left arrow keys to step forward or backward by one 60 fps frame;
backward stepping stops at zero.

## Debug Indicator

When debug mode 1–6 is active, a label in the top-left corner identifies the
current visualization. Modes 1–3 show UV coordinates, radial distance, and a UV
grid. Mode 4 maps final-output luminance from dark blue through green and yellow
to bright red. Mode 5 marks invalid shader output: magenta for NaN, cyan for
infinity, blue for negative values, and amber for values above one. Mode 6
shows the original scene on the left and the fully post-processed result on the
right. The label is hidden in normal mode 0.

To add an effect, create a fragment shader in `src/shaders/effects/`, then add
it to `postProcessDefinitions` in `src/pipeline/post-process/config.ts`.

## Hot Reload

During development, Vite HMR updates:

- `src/shaders/main.frag`
- `src/pipeline/post-process/config.ts`
- `src/gl/include.ts`

Scene-only updates replace their program only after compilation succeeds.
Changes to shared includes build a complete replacement resource set and swap
it in only after every shader compiles, so a partial update cannot mix old and
new programs. If recompilation fails, the error is printed in the terminal and
the active render resources remain unchanged.

## Architecture

The code is split into composition, orchestration, pure state/planning, and GPU
infrastructure layers. Dependencies point inward toward small interfaces and
pure modules; the WebGL pipeline does not import Vite HMR, terminal logging, or
raw shader assets.

```text
src/main.ts (composition root)
├── shader assets + include resolution
├── input bindings, HMR, and diagnostic adapters
├── ParameterPanel + DebugIndicator      (DOM adapters)
├── PlaybackControls                     (DOM adapter)
│   └── PlaybackClock                    (pure time state)
└── Renderer
    ├── render size calculation
    └── RenderResources
        ├── ScenePass
        └── PostProcessPipeline
            ├── PostProcessState       (pure state transitions)
            ├── render plan            (pure routing decisions)
            ├── PostProcessPrograms    (transactional program ownership)
            └── framebuffer/draw helpers

vite.config.ts
└── dev-dashboard/dashboard.ts         (pure terminal formatting)
```

`src/main.ts` is the composition root. It is the only runtime module that
knows how shader assets, browser input, HMR events, renderer callbacks, and the
animation loop are connected. Diagnostics are injected into `Renderer` as
callbacks, and controls depend on the narrow `PostProcessControls` interface.

`PlaybackClock` converts monotonic animation-frame timestamps into shader time
and owns pause, reset, stepping, and speed changes. `PlaybackControls` only
translates DOM events into clock operations. `Renderer` therefore receives an
already calculated time in seconds and has no dependency on playback UI state.

`Renderer` handles browser and context lifecycle concerns. A complete
`RenderResources` instance can be constructed before replacing the active one,
which makes shared shader reloads atomic. Context loss pauses rendering and
restoration rebuilds resources while retaining pass state.

`PostProcessPipeline` coordinates rendering but delegates mutable selection,
enabled state, and parameter values to `PostProcessState`, routing to
`buildPostProcessRenderPlan`, and program lifetime to `PostProcessPrograms`.
The state and planning modules have no WebGL or browser dependency, so edge
cases can be tested without a canvas.

Low-level modules in `src/gl/` and `src/pass/` own WebGL allocation, cleanup,
and draw calls. They do not depend on renderer or application modules.

The terminal dashboard follows the same boundary: the Vite plugin owns server
events and output, while `src/dev-dashboard/dashboard.ts` is a pure formatter.

## Project Layout

```text
.
├── index.html
├── src/
│   ├── main.ts
│   ├── renderer.ts
│   ├── renderer/
│   │   ├── resources.ts
│   │   └── size.ts
│   ├── hmr.ts
│   ├── style.css
│   ├── debug/
│   │   ├── controls.ts
│   │   └── state.ts
│   ├── dev-dashboard/
│   │   └── dashboard.ts
│   ├── gl/
│   │   ├── framebuffer.ts
│   │   ├── include.ts
│   │   ├── include-resolver.ts
│   │   └── program.ts
│   ├── pass/
│   │   └── draw.ts
│   ├── time/
│   │   ├── controls.ts
│   │   └── playback-clock.ts
│   ├── ui/
│   │   ├── debug-indicator.ts
│   │   ├── parameter-panel.ts
│   │   └── playback-controls.ts
│   ├── pipeline/
│   │   ├── log.ts
│   │   ├── scene/
│   │   │   └── index.ts
│   │   └── post-process/
│   │       ├── controls.ts
│   │       ├── config.ts
│   │       ├── index.ts
│   │       ├── plan.ts
│   │       ├── programs.ts
│   │       ├── state.ts
│   │       └── types.ts
│   └── shaders/
│       ├── fullscreen.vert
│       ├── main.frag
│       ├── output.frag
│       ├── effects/
│       └── lib/
├── scripts/
│   └── browser-smoke.mjs
├── test/
│   └── *.test.ts
├── vite.config.ts
├── tsconfig.json
├── tsconfig.test.json
├── package.json
└── package-lock.json
```

### Runtime Entry Points

| Path | Responsibility |
| --- | --- |
| `index.html` | Provides the fullscreen `<canvas id="canvas">` and loads `src/main.ts` |
| `src/main.ts` | App bootstrap: loads shaders, resolves includes, creates `Renderer`, wires HMR handlers, and starts `requestAnimationFrame` |
| `src/renderer.ts` | Owns the WebGL2 context lifecycle, canvas resize orchestration, and atomic resource replacement |
| `src/renderer/resources.ts` | Owns and coordinates the replaceable scene and post-process resource set |
| `src/renderer/size.ts` | Pure render-size calculation with DPR and texture-size limits |
| `src/hmr.ts` | Small helpers for shader reloads and Vite websocket events |
| `src/debug/controls.ts` | Browser keyboard adapter for debug-mode changes |
| `src/debug/state.ts` | Pure debug-mode state |
| `src/ui/parameter-panel.ts` | Collapsible DOM inspector for pass selection, toggles, and numeric parameters |
| `src/ui/debug-indicator.ts` | Top-left label for the active shader debug visualization |
| `src/time/playback-clock.ts` | Pure shader-time state for pause, reset, frame stepping, and playback speed |
| `src/time/controls.ts` | Browser keyboard adapter for Space-driven pause/resume |
| `src/ui/playback-controls.ts` | Bottom-left DOM controls for the playback clock |
| `src/style.css` | Fullscreen black canvas layout |

### WebGL Infrastructure

| Path | Responsibility |
| --- | --- |
| `src/gl/program.ts` | Compiles shaders, links programs, reports compile/link errors, and releases temporary shader objects |
| `src/gl/framebuffer.ts` | Manages framebuffer-backed textures and resizes render targets |
| `src/gl/include.ts` | Resolves GLSL include directives from eagerly imported shader modules and reports dependency graphs |
| `src/gl/include-resolver.ts` | Pure include-resolution and include-graph logic used by the runtime and unit tests |
| `src/pass/draw.ts` | Shared fullscreen draw helper for binding framebuffers, uniforms, textures, and issuing `drawArrays` |

### Render Pipeline

| Path | Responsibility |
| --- | --- |
| `src/pipeline/scene/index.ts` | Renders the main scene fragment shader into an offscreen framebuffer |
| `src/pipeline/post-process/index.ts` | Runs enabled post-process passes, ping-pongs intermediate framebuffers, and writes the final pass to screen |
| `src/pipeline/post-process/config.ts` | Registers effect shaders and defines pass order, initial state, and parameter constraints |
| `src/pipeline/post-process/controls.ts` | Maps keyboard commands onto the narrow post-process controls interface |
| `src/pipeline/post-process/state.ts` | Pure pass selection, toggling, reconciliation, and snapshot state |
| `src/pipeline/post-process/plan.ts` | Pure texture-routing plan for enabled passes |
| `src/pipeline/post-process/programs.ts` | Transactional compilation, replacement, and disposal of effect programs |
| `src/pipeline/post-process/types.ts` | Shared post-process configuration and snapshot types |
| `src/pipeline/log.ts` | Sends render-pipeline and resolution state to the Vite dev server logger |

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
| `vite.config.ts` | Defines the Vite config and a custom ANSI dev-dashboard plugin |
| `src/dev-dashboard/dashboard.ts` | Pure formatter for the terminal dashboard |
| `scripts/browser-smoke.mjs` | Local headless-Chromium WebGL smoke test |
| `tsconfig.json` | Application TypeScript compiler configuration |
| `tsconfig.test.json` | Type-check configuration for tests and Vite config |
| `package.json` | npm scripts and development dependencies |
| `package-lock.json` | Locked npm dependency tree |
| `test/*.test.ts` | Unit tests for pure logic, adapters, and WebGL resource failure/cleanup paths |

## Notes

- This project is structured as a shader workbench.
- Effect availability, order, default state, and parameter constraints are
  managed in source code; runtime values can be edited in the browser inspector.
- Canvas render resolution is derived from CSS size and `devicePixelRatio`, with
  DPR capped at `2` and dimensions limited by the GPU maximum texture size.
