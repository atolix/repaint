export const DEBUG_MODE = {
  normal: 0,
  uvCoordinates: 1,
  radialDistance: 2,
  uvGrid: 3,
  luminanceHeatmap: 4,
  nonFiniteValues: 5,
  beforeAfter: 6,
} as const;

export type DebugMode = typeof DEBUG_MODE[keyof typeof DEBUG_MODE];

export const debugModes: readonly {
  id: DebugMode;
  label: string | null;
  requiresFinalTexture: boolean;
}[] = [
  { id: DEBUG_MODE.normal, label: null, requiresFinalTexture: false },
  { id: DEBUG_MODE.uvCoordinates, label: "UV coordinates", requiresFinalTexture: false },
  { id: DEBUG_MODE.radialDistance, label: "Radial distance", requiresFinalTexture: false },
  { id: DEBUG_MODE.uvGrid, label: "UV grid", requiresFinalTexture: false },
  {
    id: DEBUG_MODE.luminanceHeatmap,
    label: "Luminance heatmap",
    requiresFinalTexture: true,
  },
  {
    id: DEBUG_MODE.nonFiniteValues,
    label: "Non-finite values",
    requiresFinalTexture: false,
  },
  {
    id: DEBUG_MODE.beforeAfter,
    label: "Before / after",
    requiresFinalTexture: true,
  },
];

export function getDebugModeLabel(mode: number) {
  return debugModes.find((definition) => definition.id === mode)?.label ?? null;
}

export function getNextDebugMode(mode: number): DebugMode {
  const index = debugModes.findIndex((definition) => definition.id === mode);
  return debugModes[(index + 1) % debugModes.length].id;
}

export function debugModeRequiresFinalTexture(mode: number) {
  return debugModes.find((definition) => definition.id === mode)
    ?.requiresFinalTexture ?? false;
}
