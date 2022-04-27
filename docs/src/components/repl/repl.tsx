import {
  component$,
  Host,
  noSerialize,
  useScopedStyles$,
  useStore,
  useWatchEffect$,
} from '@builder.io/qwik';
import { isBrowser } from '@builder.io/qwik/build';
import { ReplInputPanel } from './repl-input-panel';
import { ReplOutputPanel } from './repl-output-panel';
import styles from './repl.css?inline';
import type { ReplInputOptions, ReplProps, ReplStore, ReplResult } from './types';

export const Repl = component$(async (props: ReplProps) => {
  useScopedStyles$(styles);

  const store = useStore<ReplStore>({
    inputs: props.inputs || [],
    outputHtml: '',
    clientModules: [],
    serverModules: [],
    diagnostics: [],
    selectedInputPath: '',
    selectedOutputPanel: 'app',
    selectedClientModule: '',
    selectedServerModule: '',
    version: '0.0.19-0',
    minify: 'none',
    entryStrategy: 'single',
    ssrBuild: true,
    debug: false,
    enableFileDelete: props.enableFileDelete,
    iframeUrl: 'about:blank',
    iframeWindow: null,
  });

  if (!store.selectedInputPath) {
    if (store.inputs.some((i) => i.path === props.selectedInputPath)) {
      store.selectedInputPath = props.selectedInputPath!;
    } else if (store.inputs.length > 0) {
      store.selectedInputPath = store.inputs[0].path;
    }
  }

  const onInputChange = (path: string, code: string) => {
    const input = store.inputs.find((i) => i.path === path);
    if (input) {
      input.code = code;
      postReplInputUpdate();
    }
  };

  const postReplInputUpdate = () => {
    const opts: ReplInputOptions = {
      debug: store.debug,
      srcInputs: store.inputs,
      minify: store.minify,
      entryStrategy: {
        type: store.entryStrategy as any,
      },
    };

    const data = {
      type: 'update',
      version: store.version,
      options: opts,
    };

    if (store.iframeWindow && opts.srcInputs.length > 0) {
      store.iframeWindow.postMessage(JSON.stringify(data));
    }
  };

  const updateReplOutput = (result: ReplResult) => {
    store.outputHtml = result.outputHtml;
    store.clientModules = result.clientModules;
    store.serverModules = result.serverModules;
    store.diagnostics = result.diagnostics;

    if (!result.clientModules.some((m) => m.path === store.selectedClientModule)) {
      if (result.clientModules.length > 0) {
        store.selectedClientModule = result.clientModules[0].path;
      } else {
        store.selectedClientModule = '';
      }
    }

    if (!result.serverModules.some((m) => m.path === store.selectedServerModule)) {
      if (result.serverModules.length > 0) {
        store.selectedServerModule = result.serverModules[0].path;
      } else {
        store.selectedServerModule = '';
      }
    }

    if (result.diagnostics.length > 0) {
      store.selectedOutputPanel = 'diagnostics';
    } else if (result.diagnostics.length === 0 && store.selectedOutputPanel === 'diagnostics') {
      store.selectedOutputPanel = 'app';
    }
  };

  const onMessageFromIframe = (ev: MessageEvent) => {
    switch (ev.data?.type) {
      case 'replready': {
        store.iframeWindow = noSerialize(ev.source as any);
        postReplInputUpdate();
        break;
      }
      case 'result': {
        updateReplOutput(ev.data);
        break;
      }
    }
  };

  useWatchEffect$(() => {
    if (isBrowser) {
      store.iframeUrl = '/repl/index.html';
      if (location.hostname === 'qwik.builder.io') {
        // use a different domain on purpose
        store.iframeUrl = 'https://qwik-docs.pages.dev' + store.iframeUrl;
      }

      window.addEventListener('message', onMessageFromIframe);
    }
  });

  return (
    <Host
      class={{
        repl: true,
        'repl-narrow': props.layout === 'narrow',
        'repl-wide': props.layout === 'wide',
      }}
    >
      <ReplInputPanel store={store} onInputChange={onInputChange} />

      <ReplOutputPanel store={store} />

      <div class="footer-panel"></div>
    </Host>
  );
});
