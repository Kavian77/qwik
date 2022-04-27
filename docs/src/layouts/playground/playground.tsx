import {
  component$,
  Host,
  useHostElement,
  useScopedStyles$,
  useStore,
  useWatchEffect$,
} from '@builder.io/qwik';
import type { TransformModuleInput } from '@builder.io/qwik/optimizer';
import type { SiteStore } from '../../components/app/app';
import { Repl } from '../../components/repl/repl';
import styles from './playground.css?inline';
import { Header } from '../../components/header/header';
import { setHeadMeta, setHeadStyles } from '@builder.io/qwest';
import playgroundApps from './playground-data';

interface PlaygroundLayoutProps {
  store: SiteStore;
}

const Playground = component$((props: PlaygroundLayoutProps) => {
  const hostElm = useHostElement();

  const store = useStore<PlaygroundStore>({
    title: '',
    inputs: [],
  });

  useWatchEffect$(() => {
    const helloWorldApp = playgroundApps.find((p) => p.id === 'hello-world')!;
    store.title = helloWorldApp.title;
    store.inputs = helloWorldApp.inputs;
  });

  setHeadMeta(hostElm, { title: store.title });

  setHeadStyles(hostElm, [
    {
      style: `html,body { margin: 0; height: 100%; overflow: hidden; }`,
    },
  ]);

  useScopedStyles$(styles);

  return (
    <Host class="full-width playground">
      <Header store={props.store} />
      <main>
        <Repl inputs={store.inputs} layout="wide" enableFileDelete={true} />
      </main>
    </Host>
  );
});

interface PlaygroundStore {
  title: string;
  inputs: TransformModuleInput[];
}

export default Playground;
