import { component$, Host, Slot, useHostElement, useScopedStyles$ } from '@builder.io/qwik';
import { useLocation } from '../../utils/useLocation';
import type { SiteStore } from '../../components/app/app';
import { Repl } from '../../components/repl/repl';
import styles from './tutorial.css?inline';
import { TutorialContentFooter } from './tutorial-content-footer';
import { TutorialContentHeader } from './tutorial-content-header';
import tutorialData, { TutorialSection } from './tutorial-data';
import { Header } from '../../components/header/header';
import { setHeadStyles } from '@builder.io/qwest';

interface TutorialLayoutProps {
  store: SiteStore;
}

const Tutorial = component$((props: TutorialLayoutProps) => {
  useScopedStyles$(styles);

  const hostElm = useHostElement();
  setHeadStyles(hostElm, [
    {
      style: `html,body { margin: 0; height: 100%; overflow: hidden; }`,
    },
  ]);

  const loc = useLocation();

  const getTutorialApp = (items: TutorialSection[] | undefined): TutorialSection | null => {
    if (items) {
      for (const t of items) {
        if (t.path === loc.pathname) {
          return t;
        }
        const c = getTutorialApp(t.items);
        if (c) {
          return c;
        }
      }
    }
    return null;
  };

  const currentItem = getTutorialApp(tutorialData);
  if (!currentItem) {
    return <div>Unable to find tutorial: {loc.pathname}</div>;
  }

  return (
    <Host class="full-width tutorial">
      <Header store={props.store} />
      <main>
        <div class="content-panel">
          <TutorialContentHeader currentItem={currentItem} />
          <div class="content-main">
            <div>
              <Slot />
            </div>
          </div>
          <TutorialContentFooter currentItem={currentItem} />
        </div>
        <div class="repl-panel">
          <Repl inputs={currentItem.inputs} layout="narrow" />
        </div>
      </main>
    </Host>
  );
});

export default Tutorial;
