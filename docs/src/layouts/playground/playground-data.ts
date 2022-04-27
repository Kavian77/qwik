import type { TransformModuleInput } from '@builder.io/qwik/optimizer';

export interface PlaygroundApp {
  title: string;
  id: string;
  inputs: TransformModuleInput[];
}

// generated at build-time
const apps: PlaygroundApp[] = [];
export default apps;
