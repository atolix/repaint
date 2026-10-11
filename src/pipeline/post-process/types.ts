export type PostProcessNumberParameterConfig = {
  key: string;
  label: string;
  uniform: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

export type PostProcessNumberParameterState =
  PostProcessNumberParameterConfig & {
    value: number;
  };

export type PostProcessPassConfig = {
  name: string;
  path: string;
  source: string;
  enabled: boolean;
  parameters?: readonly PostProcessNumberParameterConfig[];
};

export type PostProcessPassState = {
  name: string;
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
