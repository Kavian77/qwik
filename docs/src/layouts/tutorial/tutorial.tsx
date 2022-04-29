import {
  component$,
  Host,
  Slot,
  useHostElement,
  useScopedStyles$,
  useStore,
  useWatchEffect$,
} from '@builder.io/qwik';
import { useLocation } from '../../utils/useLocation';
import type { SiteStore } from '../../components/app/app';
import { Repl } from '../../components/repl/repl';
import styles from './tutorial.css?inline';
import { TutorialContentFooter } from './tutorial-content-footer';
import { TutorialContentHeader } from './tutorial-content-header';
import tutorialSections, { TutorialApp } from './tutorial-data';
import { Header } from '../../components/header/header';
import { setHeadStyles } from '@builder.io/qwest';
import type { ReplModuleInput } from 'src/components/repl/types';

interface TutorialLayoutProps {
  store: SiteStore;
}

const Tutorial = component$((props: TutorialLayoutProps) => {
  useScopedStyles$(styles);

  const store = useStore<TutorialStore>({
    inputs: [],
  });

  useWatchEffect$((track) => {
    track(store, 'inputs');

    // why does this keep running?
    setHeadStyles(useHostElement(), [
      {
        style: `html,body { margin: 0; height: 100%; overflow: hidden; }`,
      },
    ]);
  });

  const loc = useLocation();
  const getTutorialApp = (): TutorialApp | undefined => {
    for (const s of tutorialSections) {
      for (const t of s.tutorials) {
        if (`/tutorial/${t.id}` === loc.pathname) {
          return t;
        }
      }
    }
  };

  const currentTutorial = getTutorialApp();
  if (!currentTutorial) {
    return <p>Unable to find tutorial: {loc.pathname}</p>;
  }

  store.inputs = currentTutorial.problemInputs;

  if (!store.inputs.some((i) => i.code === '/root.tsx')) {
    store.inputs.push({ path: '/root.tsx', code: DEFAULT_ROOT, hidden: true });
  }

  if (!store.inputs.some((i) => i.code === '/entry.server.tsx')) {
    store.inputs.push({ path: '/entry.server.tsx', code: DEFAULT_ENTRY_SERVER, hidden: true });
  }

  return (
    <Host class="full-width tutorial">
      <Header store={props.store} />
      <main>
        <div class="tutorial-content-panel">
          <TutorialContentHeader currentTutorial={currentTutorial} />
          <div class="content-main">
            <div>
              <Slot />
            </div>
          </div>
          <TutorialContentFooter currentTutorial={currentTutorial} store={store} />
        </div>
        <div class="tutorial-repl-panel">
          <Repl
            inputs={store.inputs}
            enableHtmlOutput={currentTutorial.enableHtmlOutput}
            enableClientOutput={currentTutorial.enableClientOutput}
            enableSsrOutput={currentTutorial.enableSsrOutput}
          />
          <div class="tutorial-repl-footer" />
        </div>
      </main>
    </Host>
  );
});

export const DEFAULT_ENTRY_SERVER = `
import { renderToString, RenderToStringOptions } from '@builder.io/qwik/server';
import { Root } from './root';

export function render(opts: RenderToStringOptions) {
  return renderToString(<Root />, opts);
}
`;

export const DEFAULT_ROOT = `
import { App } from './app';
export const Root = () => {
  return (
    <html>
      <head>
        <title>Tutorial</title>
      </head>
      <body>
        <App />
      </body>
    </html>
  );
};
`;

export default Tutorial;

export interface TutorialStore {
  inputs: ReplModuleInput[];
}
