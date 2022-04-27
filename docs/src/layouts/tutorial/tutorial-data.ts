import type { TransformModuleInput } from '@builder.io/qwik/optimizer';

export interface TutorialSection {
  title: string;
  items?: TutorialSection[];
  path?: string;
  inputs?: TransformModuleInput[];
}

// generated at build-time
// see /docs/pages/tutorial/tutorial-menu.json
const tutorials: TutorialSection[] = [];
export default tutorials;
