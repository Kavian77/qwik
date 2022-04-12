import { useLocation } from '../../utils/useLocation';
import { TutorialItem, menu } from './tutorial-menu';

export const TutorialContentHeader = ({ currentItem }: { currentItem: TutorialItem }) => {
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
            loc.href = elm.value;
          }
        }}
      >
        {menu.map((m) => (
          <optgroup label={m.title}>
            {m.items.map((i) => (
              <option selected={i.path === currentItem.path} value={i.path}>
                {i.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <h1>{currentItem.title}</h1>
    </div>
  );
};
