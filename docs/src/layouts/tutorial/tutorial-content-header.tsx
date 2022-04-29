import { useLocation } from '../../utils/useLocation';
import tutorialSections, { TutorialApp } from './tutorial-data';

export const TutorialContentHeader = ({ currentTutorial }: { currentTutorial: TutorialApp }) => {
  const loc = useLocation();

  return (
    <div class="content-header">
      <svg width="24" height="24">
        <path
          d="M5 6h14M5 12h14M5 18h14"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>

      <select
        onChange$={(_, elm: any) => {
          if (loc.pathname !== elm.value) {
            loc.href = `/tutorial/${elm.value}`;
          }
        }}
      >
        {tutorialSections.map((s) => (
          <optgroup label={s.title}>
            {s.tutorials.map((t) => (
              <option selected={t.id === currentTutorial.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <h1>{currentTutorial.title}</h1>
    </div>
  );
};
