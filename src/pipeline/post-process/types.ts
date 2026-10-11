export type PostProcessNumberParameterConfig = {
  key: string;
  label: string;
  uniform: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  value?: number;
};

export type PostProcessNumberParameterState =
  Omit<PostProcessNumberParameterConfig, "value"> & {
    value: number;
  };

export type PostProcessPassConfig = {
  name: string;
  description: string;
  path: string;
  source: string;
  enabled: boolean;
  parameters?: readonly PostProcessNumberParameterConfig[];
};

export type PostProcessPassState = {
  name: string;
  description?: string;
  enabled: boolean;
  parameters?: readonly PostProcessNumberParameterState[];
};

export type SelectedPass = {
  name: string;
  index: number;
};

export type ToggledPass = SelectedPass & {
  enabled: boolean;
};

export type PostProcessSnapshot = {
  passes: readonly PostProcessPassState[];
  selectedPassIndex: number;
};

export type PostProcessShaderSources = {
  vertex: string;
  output: string;
};
