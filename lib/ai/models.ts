export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'llama2',
    label: 'Llama 2',
    apiIdentifier: 'llama2',
    description: 'Open source large language model by Meta',
  },
  {
    id: 'mistral',
    label: 'Mistral',
    apiIdentifier: 'mistral',
    description: 'Open source 7B parameter model',
  },
] as const;

export const DEFAULT_MODEL_NAME = 'llama2'; 