export type PostProcessPassConfig = {
  name: string;
  path: string;
  source: string;
  enabled: boolean;
};

export type PostProcessPassState = {
  name: string;
  enabled: boolean;
};

export type SelectedPass = {
  name: string;
  index: number;
};

export type ToggledPass = SelectedPass & {
  enabled: boolean;
};
