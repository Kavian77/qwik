import type { TutorialStore } from './tutorial';
import tutorialSections, { TutorialApp } from './tutorial-data';

export const TutorialContentFooter = ({ currentTutorial, store }: TutorialContentFooterProps) => {
  const tutorials: TutorialApp[] = [];
  tutorialSections.forEach((s) => tutorials.push(...s.tutorials));

  const currentIndex = tutorials.findIndex((i) => i.id === currentTutorial.id);
  const prev = tutorials[currentIndex - 1];
  const next = tutorials[currentIndex + 1];

  return (
    <div class="content-footer">
      <div>
        <button
          class="show-me"
          onClick$={() => {
            // why doesn't this work?
            store.inputs = currentTutorial.solutionInputs;
          }}
        >
          Show Me
        </button>
      </div>
      <nav>
        {prev ? (
          <a href={`/tutorial/${prev.id}`} class="prev">
            Previous
          </a>
        ) : null}
        {next ? (
          <a href={`/tutorial/${next.id}`} class="next">
            Next
          </a>
        ) : null}
      </nav>
    </div>
  );
};

interface TutorialContentFooterProps {
  currentTutorial: TutorialApp;
  store: TutorialStore;
}
