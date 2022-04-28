import { component$, Host, useHostElement, useScopedStyles$, useStore } from '@builder.io/qwik';
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
    version: '',
  });

  const helloWorldApp = playgroundApps.find((p) => p.id === 'hello-world')!;
  store.title = helloWorldApp.title;
  store.inputs = helloWorldApp.inputs;

  setHeadMeta(hostElm, { title: `${store.title} - Qwik Playground` });

  setHeadStyles(hostElm, [
    {
      style: `html,body { margin: 0; height: 100%; overflow: hidden; }`,
    },
  ]);

  useScopedStyles$(styles);

  return (
    <Host class="full-width playground">
      <Header store={props.store} />
      <div class="playground-header"></div>
      <Repl inputs={store.inputs} enableFileDelete={true} version={store.version} />
    </Host>
  );
});

interface PlaygroundStore {
  title: string;
  inputs: TransformModuleInput[];
  version: string;
}

export default Playground;
