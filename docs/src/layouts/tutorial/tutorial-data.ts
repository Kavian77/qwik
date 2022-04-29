import type { TransformModuleInput } from '@builder.io/qwik/optimizer';

export interface TutorialSection {
  id: string;
  title: string;
  tutorials: TutorialApp[];
}

export interface TutorialApp {
  id: string;
  title: string;
  problemInputs: TransformModuleInput[];
  solutionInputs: TransformModuleInput[];
  enableHtmlOutput?: boolean;
  enableClientOutput?: boolean;
  enableSsrOutput?: boolean;
}

// generated at build-time
// see /docs/pages/tutorial/tutorial-menu.json
const tutorials: TutorialSection[] = [];
export default tutorials;
